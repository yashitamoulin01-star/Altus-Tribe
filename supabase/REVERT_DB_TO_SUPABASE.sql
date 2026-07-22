-- ============================================================
-- Altus Tribe — REVERT DATABASE back to Supabase Auth.
-- Undoes migration 0018 (Clerk identity): restores auth.uid()-based RLS,
-- the profile auto-create trigger, and the auth.users link.
-- Idempotent / safe to re-run. Paste into Supabase SQL editor and Run.
-- ============================================================

-- ---------- 1. Restore SECURITY DEFINER helpers to auth.uid() ----------
create or replace function public.auth_role()
returns user_role language sql stable security definer set search_path=public as $$
  select role from public.profiles where id = auth.uid(); $$;

create or replace function public.is_conversation_member(cid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.conversation_members cm
    where cm.conversation_id=cid and cm.profile_id=auth.uid()); $$;

create or replace function public.profile_is_visible(pid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.profiles p where p.id=pid and (
    p.id=auth.uid() or public.is_admin()
    or (p.status='active' and p.visibility='public')
    or (auth.role()='authenticated' and p.status='active' and p.visibility='tribe')
    or (auth.role()='authenticated' and p.status='active' and p.visibility='private'
        and public.are_connected(auth.uid(), p.id))
    or exists (select 1 from public.participant_admin pa
        where pa.profile_id=p.id and pa.designated_consultant=auth.uid())));
$$;

-- ---------- 2. Restore all direct policies to auth.uid() ----------
-- profiles
drop policy if exists "self edits own profile" on public.profiles;
create policy "self edits own profile" on public.profiles for update to authenticated
  using ( auth.uid() = id ) with check ( auth.uid() = id );
drop policy if exists "members read visible profiles" on public.profiles;
create policy "members read visible profiles" on public.profiles for select to authenticated
  using ( public.profile_is_visible(id) );
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles for all to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );

-- child tables
do $$ declare t text;
begin
  foreach t in array array['businesses','expertise','offerings','work_items','social_links','member_open_to','addresses'] loop
    execute format('drop policy if exists "owner or admin writes child" on public.%I', t);
    execute format('create policy "owner or admin writes child" on public.%I for all to authenticated using ( profile_id=auth.uid() or public.is_admin() ) with check ( profile_id=auth.uid() or public.is_admin() )', t);
  end loop;
end $$;

-- messaging
drop policy if exists "members create conversations" on public.conversations;
create policy "members create conversations" on public.conversations for insert to authenticated with check ( created_by=auth.uid() or public.is_admin() );
drop policy if exists "join conversations" on public.conversation_members;
create policy "join conversations" on public.conversation_members for insert to authenticated with check ( profile_id=auth.uid() or public.is_conversation_member(conversation_id) or public.is_admin() );
drop policy if exists "update own membership" on public.conversation_members;
create policy "update own membership" on public.conversation_members for update to authenticated using ( profile_id=auth.uid() ) with check ( profile_id=auth.uid() );
drop policy if exists "members send as self" on public.messages;
create policy "members send as self" on public.messages for insert to authenticated with check ( sender_id=auth.uid() and public.is_conversation_member(conversation_id) );
drop policy if exists "edit or delete own messages" on public.messages;
create policy "edit or delete own messages" on public.messages for update to authenticated using ( sender_id=auth.uid() or public.is_admin() ) with check ( sender_id=auth.uid() or public.is_admin() );
drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications for select to authenticated using ( recipient_id=auth.uid() );
drop policy if exists "update own notifications" on public.notifications;
create policy "update own notifications" on public.notifications for update to authenticated using ( recipient_id=auth.uid() ) with check ( recipient_id=auth.uid() );
drop policy if exists "admins write notifications" on public.notifications;
create policy "admins write notifications" on public.notifications for insert to authenticated with check ( public.is_admin() or recipient_id=auth.uid() );
drop policy if exists "own prefs" on public.notification_prefs;
create policy "own prefs" on public.notification_prefs for all to authenticated using ( profile_id=auth.uid() ) with check ( profile_id=auth.uid() );
drop policy if exists "own push subs" on public.push_subscriptions;
create policy "own push subs" on public.push_subscriptions for all to authenticated using ( profile_id=auth.uid() ) with check ( profile_id=auth.uid() );

-- connections
drop policy if exists "see own connections" on public.connections;
create policy "see own connections" on public.connections for select to authenticated using ( requester_id=auth.uid() or addressee_id=auth.uid() or public.is_admin() );
drop policy if exists "send request" on public.connections;
create policy "send request" on public.connections for insert to authenticated with check ( requester_id=auth.uid() );
drop policy if exists "respond to request" on public.connections;
create policy "respond to request" on public.connections for update to authenticated using ( requester_id=auth.uid() or addressee_id=auth.uid() ) with check ( requester_id=auth.uid() or addressee_id=auth.uid() );
drop policy if exists "remove connection" on public.connections;
create policy "remove connection" on public.connections for delete to authenticated using ( requester_id=auth.uid() or addressee_id=auth.uid() );

-- profile_views
drop policy if exists "record own views" on public.profile_views;
create policy "record own views" on public.profile_views for insert to authenticated with check ( viewer_id=auth.uid() );
drop policy if exists "refresh own views" on public.profile_views;
create policy "refresh own views" on public.profile_views for update to authenticated using ( viewer_id=auth.uid() ) with check ( viewer_id=auth.uid() );
drop policy if exists "owner reads views" on public.profile_views;
create policy "owner reads views" on public.profile_views for select to authenticated using ( owner_id=auth.uid() or viewer_id=auth.uid() );

-- campus
drop policy if exists "own resource activity" on public.resource_activity;
create policy "own resource activity" on public.resource_activity for all to authenticated using ( profile_id=auth.uid() ) with check ( profile_id=auth.uid() );

-- CRM
drop policy if exists "crm admin or designated consultant" on public.participant_admin;
create policy "crm admin or designated consultant" on public.participant_admin for all to authenticated using ( public.is_admin() or designated_consultant=auth.uid() ) with check ( public.is_admin() or designated_consultant=auth.uid() );
drop policy if exists "assets admin or designated consultant" on public.participant_assets;
create policy "assets admin or designated consultant" on public.participant_assets for all to authenticated using ( public.is_admin() or exists (select 1 from public.participant_admin pa where pa.profile_id=participant_assets.profile_id and pa.designated_consultant=auth.uid()) ) with check ( public.is_admin() or exists (select 1 from public.participant_admin pa where pa.profile_id=participant_assets.profile_id and pa.designated_consultant=auth.uid()) );
drop policy if exists "notes admin or designated consultant" on public.admin_notes;
create policy "notes admin or designated consultant" on public.admin_notes for all to authenticated using ( public.is_admin() or exists (select 1 from public.participant_admin pa where pa.profile_id=admin_notes.profile_id and pa.designated_consultant=auth.uid()) ) with check ( public.is_admin() or author_id=auth.uid() );

-- audit
drop policy if exists "actor appends own audit" on public.audit_logs;
create policy "actor appends own audit" on public.audit_logs for insert to authenticated with check ( actor_id=auth.uid() );

-- ---------- 3. Restore the profile auto-create trigger, with the "request to get
--             in" (pending approval) gate PAUSED: new users are created ACTIVE and
--             go straight into the app (no admin approval queue). To re-enable the
--             gate later, change 'active' back to 'pending' below. ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare display_name text;
begin
  display_name := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''), split_part(new.email,'@',1), 'Member');
  insert into public.profiles (id, slug, full_name, status)
  values (new.id, public.generate_profile_slug(display_name), display_name, 'active')
  on conflict (id) do nothing;
  return new;
exception when others then
  raise warning 'handle_new_user failed for auth user %: % (SQLSTATE %)', new.id, sqlerrm, sqlstate;
  return new;
end; $$;

-- Pause the gate for anyone already stuck in the queue: make existing pending
-- members active so they aren't held on /pending.
update public.profiles set status='active' where status='pending';

grant execute on function public.handle_new_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 4. (Optional) drop the now-unused Clerk helper ----------
drop function if exists public.current_profile_id();

-- clerk_id column is left in place (harmless). Backfill any auth users missing a profile:
do $$
declare u record; nm text;
begin
  for u in select au.id, au.email, au.raw_user_meta_data from auth.users au
           left join public.profiles p on p.id=au.id where p.id is null loop
    nm := coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'),''), split_part(u.email,'@',1),'Member');
    insert into public.profiles (id, slug, full_name)
    values (u.id, public.generate_profile_slug(nm), nm) on conflict (id) do nothing;
  end loop;
end $$;

-- ---------- 5. Make mouliyashita@gmail.com the admin ----------
-- Promote by email (works once the auth user + profile exist).
update public.profiles p
set role='admin', status='active'
from auth.users u
where u.id = p.id and lower(u.email) = lower('mouliyashita@gmail.com');

-- Belt-and-suspenders: also promote by the known UUID, creating the profile row
-- if it is somehow missing (idempotent). UUID = mouliyashita@gmail.com.
insert into public.profiles (id, slug, full_name, role, status)
values ('e0e7e24c-5026-4ead-9e0a-fa5012a48807',
        public.generate_profile_slug('Yashita Mouli'), 'Yashita Mouli', 'admin', 'active')
on conflict (id) do update set role='admin', status='active';

-- Verify (should return the admin row):
select p.full_name, p.role, p.status, u.email
from public.profiles p join auth.users u on u.id=p.id
where p.role='admin';

-- ============================================================
-- DONE. Your DB is back on Supabase Auth, the pending gate is paused
-- (new users = active), and mouliyashita@gmail.com is admin.
-- Verify after signing in:  select auth.uid();
-- ============================================================
