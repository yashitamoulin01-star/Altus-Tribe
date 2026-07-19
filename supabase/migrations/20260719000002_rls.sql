-- Altus Tribe — Row-Level Security (docs/04-database-schema.md §7)
-- A member sees the Tribe; the public sees only public profiles; admins see all;
-- consultants additionally see the CRM layer for their assigned participants.
--
-- Note: the doc sketches policies with inline `(select role from profiles ...)`.
-- Referencing `profiles` inside a `profiles` policy causes infinite recursion, so
-- role/visibility checks are wrapped in SECURITY DEFINER helpers that bypass RLS.

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER — run as owner, bypassing RLS)
-- ---------------------------------------------------------------------------
create or replace function public.auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.auth_role() = 'admin', false);
$$;

-- Can the current caller SELECT this profile row at all?
create or replace function public.profile_is_visible(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = pid
      and (
        p.id = auth.uid()                                            -- owner
        or public.is_admin()                                         -- admin
        or (auth.role() = 'authenticated' and p.status = 'active')   -- any tribe member
        or (p.status = 'active' and p.visibility = 'public')         -- public / anon
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "tribe reads active members" on profiles for select
  to authenticated using ( status = 'active' or id = auth.uid() or public.is_admin() );

create policy "public reads public members" on profiles for select
  to anon using ( status = 'active' and visibility = 'public' );

create policy "self edits own profile" on profiles for update
  to authenticated using ( auth.uid() = id ) with check ( auth.uid() = id );

create policy "admins manage profiles" on profiles for all
  to authenticated using ( public.is_admin() ) with check ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- Child section tables: read if the parent profile is visible; write if owner/admin.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'businesses', 'expertise', 'offerings', 'work_items',
    'social_links', 'member_open_to', 'addresses'
  ]
  loop
    execute format('alter table %I enable row level security;', t);

    execute format($f$
      create policy "read visible child" on %I for select
        using ( public.profile_is_visible(profile_id) );
    $f$, t);

    execute format($f$
      create policy "owner or admin writes child" on %I for all
        to authenticated
        using ( profile_id = auth.uid() or public.is_admin() )
        with check ( profile_id = auth.uid() or public.is_admin() );
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Community & content
-- ---------------------------------------------------------------------------
alter table announcements enable row level security;
create policy "tribe reads announcements" on announcements for select
  to authenticated using ( true );
create policy "admins write announcements" on announcements for all
  to authenticated using ( public.is_admin() ) with check ( public.is_admin() );

alter table resources enable row level security;
create policy "tribe reads resources" on resources for select
  to authenticated using ( true );
create policy "admins write resources" on resources for all
  to authenticated using ( public.is_admin() ) with check ( public.is_admin() );

alter table spotlights enable row level security;
create policy "anyone reads published spotlights" on spotlights for select
  using ( published_at is not null or public.is_admin() );
create policy "admins write spotlights" on spotlights for all
  to authenticated using ( public.is_admin() ) with check ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- Private CRM layer — admins or the participant's designated consultant ONLY.
-- Members have NO policy here, so they can never read it.
-- ---------------------------------------------------------------------------
alter table participant_admin enable row level security;
create policy "crm admin or designated consultant" on participant_admin for all
  to authenticated
  using ( public.is_admin() or designated_consultant = auth.uid() )
  with check ( public.is_admin() or designated_consultant = auth.uid() );

alter table participant_assets enable row level security;
create policy "assets admin or designated consultant" on participant_assets for all
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from participant_admin pa
      where pa.profile_id = participant_assets.profile_id
        and pa.designated_consultant = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from participant_admin pa
      where pa.profile_id = participant_assets.profile_id
        and pa.designated_consultant = auth.uid()
    )
  );

alter table admin_notes enable row level security;
create policy "notes admin or designated consultant" on admin_notes for all
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from participant_admin pa
      where pa.profile_id = admin_notes.profile_id
        and pa.designated_consultant = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or author_id = auth.uid()
  );
