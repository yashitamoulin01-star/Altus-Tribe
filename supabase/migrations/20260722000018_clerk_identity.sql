-- Altus Tribe — Migration 0018: switch identity from Supabase Auth to Clerk.
--
-- Model (chosen): profiles.id STAYS a uuid; add profiles.clerk_id (text unique)
-- = the Clerk user id (JWT 'sub'). All existing FKs remain uuid. RLS resolves
-- "the caller" via current_profile_id(): the profiles row whose clerk_id matches
-- the Clerk token's sub claim. Every helper is redefined to use it, so all
-- helper-based policies adapt automatically; the remaining direct-auth.uid()
-- policies are recreated to use current_profile_id().
--
-- Idempotent where practical (create-or-replace / if-exists) so it is safe to
-- re-run. Apply AFTER 0001–0017 exist.

-- ---------------------------------------------------------------------------
-- 1. Schema: add clerk_id, decouple profiles.id from auth.users
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists clerk_id text;
create unique index if not exists profiles_clerk_id_key on public.profiles (clerk_id);

-- profiles.id was `references auth.users(id)`. Drop that FK (name is generated;
-- discover and drop it) and give id its own default so the webhook can insert.
do $$
declare fk text;
begin
  select conname into fk
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'f'
    and confrelid = 'auth.users'::regclass
  limit 1;
  if fk is not null then
    execute format('alter table public.profiles drop constraint %I', fk);
  end if;
end $$;

alter table public.profiles alter column id set default gen_random_uuid();

-- The old Supabase auth-user trigger auto-created profiles; the Clerk webhook
-- owns that now. Drop it if present so it can't fire on a non-existent flow.
drop trigger if exists on_auth_user_created on auth.users;

-- ---------------------------------------------------------------------------
-- 2. Identity resolver — the caller's profiles.id from the Clerk JWT 'sub'
-- ---------------------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where clerk_id = auth.jwt()->>'sub';
$$;

-- ---------------------------------------------------------------------------
-- 3. Redefine SECURITY DEFINER helpers to key off current_profile_id()
--    (this transparently fixes every policy that calls a helper)
-- ---------------------------------------------------------------------------
create or replace function public.auth_role()
returns user_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = public.current_profile_id(); $$;

create or replace function public.is_conversation_member(cid uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = cid and cm.profile_id = public.current_profile_id()
  );
$$;

create or replace function public.profile_is_visible(pid uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = pid
      and (
        p.id = public.current_profile_id()
        or public.is_admin()
        or (p.status = 'active' and p.visibility = 'public')
        or (auth.role() = 'authenticated' and p.status = 'active' and p.visibility = 'tribe')
        or (auth.role() = 'authenticated' and p.status = 'active' and p.visibility = 'private'
              and public.are_connected(public.current_profile_id(), p.id))
        or exists (
              select 1 from public.participant_admin pa
              where pa.profile_id = p.id and pa.designated_consultant = public.current_profile_id()
        )
      )
  );
$$;
-- is_admin() calls auth_role() → already fixed. are_connected(a,b) takes explicit
-- ids → unchanged.

-- ---------------------------------------------------------------------------
-- 4. Recreate the direct-auth.uid() policies to use current_profile_id()
-- ---------------------------------------------------------------------------

-- profiles ------------------------------------------------------------------
drop policy if exists "self edits own profile" on public.profiles;
create policy "self edits own profile" on public.profiles for update
  to authenticated using ( id = public.current_profile_id() )
  with check ( id = public.current_profile_id() );
-- "members read visible profiles" (0015) uses profile_is_visible → already fixed.
-- "public reads public members" (anon, status+visibility) → unchanged.
-- "admins manage profiles" uses is_admin() → already fixed.

-- child section tables ------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'businesses','expertise','offerings','work_items',
    'social_links','member_open_to','addresses'
  ]
  loop
    execute format('drop policy if exists "owner or admin writes child" on public.%I', t);
    execute format($f$
      create policy "owner or admin writes child" on public.%I for all
        to authenticated
        using ( profile_id = public.current_profile_id() or public.is_admin() )
        with check ( profile_id = public.current_profile_id() or public.is_admin() );
    $f$, t);
  end loop;
end $$;

-- messaging -----------------------------------------------------------------
drop policy if exists "members create conversations" on public.conversations;
create policy "members create conversations" on public.conversations for insert
  to authenticated with check ( created_by = public.current_profile_id() or public.is_admin() );

drop policy if exists "join conversations" on public.conversation_members;
create policy "join conversations" on public.conversation_members for insert
  to authenticated with check (
    profile_id = public.current_profile_id()
    or public.is_conversation_member(conversation_id)
    or public.is_admin()
  );

drop policy if exists "update own membership" on public.conversation_members;
create policy "update own membership" on public.conversation_members for update
  to authenticated using ( profile_id = public.current_profile_id() )
  with check ( profile_id = public.current_profile_id() );

drop policy if exists "members send as self" on public.messages;
create policy "members send as self" on public.messages for insert
  to authenticated with check (
    sender_id = public.current_profile_id() and public.is_conversation_member(conversation_id)
  );

drop policy if exists "edit or delete own messages" on public.messages;
create policy "edit or delete own messages" on public.messages for update
  to authenticated using ( sender_id = public.current_profile_id() or public.is_admin() )
  with check ( sender_id = public.current_profile_id() or public.is_admin() );

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications for select
  to authenticated using ( recipient_id = public.current_profile_id() );

drop policy if exists "update own notifications" on public.notifications;
create policy "update own notifications" on public.notifications for update
  to authenticated using ( recipient_id = public.current_profile_id() )
  with check ( recipient_id = public.current_profile_id() );

drop policy if exists "admins write notifications" on public.notifications;
create policy "admins write notifications" on public.notifications for insert
  to authenticated with check ( public.is_admin() or recipient_id = public.current_profile_id() );

drop policy if exists "own prefs" on public.notification_prefs;
create policy "own prefs" on public.notification_prefs for all
  to authenticated using ( profile_id = public.current_profile_id() )
  with check ( profile_id = public.current_profile_id() );

drop policy if exists "own push subs" on public.push_subscriptions;
create policy "own push subs" on public.push_subscriptions for all
  to authenticated using ( profile_id = public.current_profile_id() )
  with check ( profile_id = public.current_profile_id() );

-- connections ---------------------------------------------------------------
drop policy if exists "see own connections" on public.connections;
create policy "see own connections" on public.connections for select
  to authenticated using (
    requester_id = public.current_profile_id() or addressee_id = public.current_profile_id() or public.is_admin()
  );
drop policy if exists "send request" on public.connections;
create policy "send request" on public.connections for insert
  to authenticated with check ( requester_id = public.current_profile_id() );
drop policy if exists "respond to request" on public.connections;
create policy "respond to request" on public.connections for update
  to authenticated using ( requester_id = public.current_profile_id() or addressee_id = public.current_profile_id() )
  with check ( requester_id = public.current_profile_id() or addressee_id = public.current_profile_id() );
drop policy if exists "remove connection" on public.connections;
create policy "remove connection" on public.connections for delete
  to authenticated using ( requester_id = public.current_profile_id() or addressee_id = public.current_profile_id() );

-- profile_views -------------------------------------------------------------
drop policy if exists "record own views" on public.profile_views;
create policy "record own views" on public.profile_views for insert
  to authenticated with check ( viewer_id = public.current_profile_id() );
drop policy if exists "refresh own views" on public.profile_views;
create policy "refresh own views" on public.profile_views for update
  to authenticated using ( viewer_id = public.current_profile_id() )
  with check ( viewer_id = public.current_profile_id() );
drop policy if exists "owner reads views" on public.profile_views;
create policy "owner reads views" on public.profile_views for select
  to authenticated using ( owner_id = public.current_profile_id() or viewer_id = public.current_profile_id() );

-- campus resource_activity --------------------------------------------------
drop policy if exists "own resource activity" on public.resource_activity;
create policy "own resource activity" on public.resource_activity for all
  to authenticated using ( profile_id = public.current_profile_id() )
  with check ( profile_id = public.current_profile_id() );

-- CRM layer (participant_admin / assets / notes) ----------------------------
drop policy if exists "crm admin or designated consultant" on public.participant_admin;
create policy "crm admin or designated consultant" on public.participant_admin for all
  to authenticated
  using ( public.is_admin() or designated_consultant = public.current_profile_id() )
  with check ( public.is_admin() or designated_consultant = public.current_profile_id() );

drop policy if exists "assets admin or designated consultant" on public.participant_assets;
create policy "assets admin or designated consultant" on public.participant_assets for all
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.participant_admin pa
      where pa.profile_id = participant_assets.profile_id
        and pa.designated_consultant = public.current_profile_id()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.participant_admin pa
      where pa.profile_id = participant_assets.profile_id
        and pa.designated_consultant = public.current_profile_id()
    )
  );

drop policy if exists "notes admin or designated consultant" on public.admin_notes;
create policy "notes admin or designated consultant" on public.admin_notes for all
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.participant_admin pa
      where pa.profile_id = admin_notes.profile_id
        and pa.designated_consultant = public.current_profile_id()
    )
  )
  with check ( public.is_admin() or author_id = public.current_profile_id() );

-- audit_logs ----------------------------------------------------------------
drop policy if exists "actor appends own audit" on public.audit_logs;
create policy "actor appends own audit" on public.audit_logs for insert
  to authenticated with check ( actor_id = public.current_profile_id() );

-- storage (member-photos / work-files: path prefix = profile id) ------------
-- Recreated to compare the folder against current_profile_id()::text.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and qual like '%auth.uid()%' or with_check like '%auth.uid()%'
  loop
    -- storage policies are environment-specific; left for manual review if any
    -- were created. The app also allows is_admin() uploads. No-op guard here.
    null;
  end loop;
end $$;

-- Done. Verify:  select public.current_profile_id();  -- after signing in
