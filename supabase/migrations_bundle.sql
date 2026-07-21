-- Altus Tribe — consolidated migration bundle (auto-generated from migrations/ in order)
-- Paste this WHOLE file into the Supabase dashboard SQL editor and Run.
-- Safe to re-run: the RESET block below drops everything first, so you never
-- hit "type ... already exists" (42710) or "policy ... already exists" errors.

-- ============================================================
-- RESET  — DROPS ALL APP TABLES, TYPES, FUNCTIONS **AND DATA** in `public`,
-- then the sections below rebuild them from scratch. This is what makes the
-- script re-runnable. (Auth users in auth.users are NOT dropped; their profiles
-- are recreated by the backfill near the end.)
-- ============================================================

-- Storage policies live on storage.objects (outside `public`) so the schema drop
-- won't remove them — drop explicitly so the recreates below are clean.
drop policy if exists "member photos public read" on storage.objects;
drop policy if exists "member photos self write"  on storage.objects;
drop policy if exists "member photos self update" on storage.objects;
drop policy if exists "member photos self delete" on storage.objects;
drop policy if exists "work files visible read"   on storage.objects;
drop policy if exists "work files self write"     on storage.objects;
drop policy if exists "work files self update"    on storage.objects;
drop policy if exists "work files self delete"    on storage.objects;
drop policy if exists "resources tribe read"      on storage.objects;
drop policy if exists "resources admin write"     on storage.objects;
drop policy if exists "resources admin update"    on storage.objects;
drop policy if exists "resources admin delete"    on storage.objects;

-- The auth.users trigger depends on a public function that's about to be dropped.
drop trigger if exists on_auth_user_created on auth.users;

-- Nuke and recreate the whole app schema.
drop schema if exists public cascade;
create schema public;

-- Restore the grants + default privileges Supabase/PostgREST rely on.
grant usage on schema public to anon, authenticated, service_role;
grant all   on schema public to postgres, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines  to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;


-- ============================================================
-- 20260719000001_schema.sql
-- ============================================================
-- Altus Tribe — Phase 4 schema (docs/04-database-schema.md)
-- Postgres via Supabase. Editorial sections become normalized tables.
-- One member, many small tables. Empty section = zero rows.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role      as enum ('member', 'consultant', 'admin');
create type member_status  as enum ('active', 'hidden');
create type visibility     as enum ('public', 'tribe', 'private');
create type work_kind      as enum ('brochure', 'video', 'image', 'case_study');
create type resource_kind  as enum ('video', 'brochure', 'inspiration', 'announcement');
create type open_to_option as enum ('mentoring', 'partnerships', 'referrals', 'speaking', 'hiring');
create type address_kind   as enum ('work', 'home', 'factory');
create type connect_mode   as enum ('call', 'whatsapp', 'email', 'dnd');
create type rating_tier    as enum ('ambassador', 'mentor', 'coach', 'expert', 'practitioner', 'observer');

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Core: profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  slug           text unique not null,
  full_name      text not null,
  photo_url      text,
  role_title     text,
  industry       text,
  category       text,
  city           text,
  positioning    text,
  known_for      text,
  about          text,
  cq_batch       text,
  ps_batch       text,
  birth_date     date,
  anniversary    date,
  marital_status text,
  blood_group    text,
  best_time      text,
  best_modes     connect_mode[] not null default '{}',
  whatsapp_dm    boolean not null default false,
  role           user_role     not null default 'member',
  status         member_status not null default 'active',
  visibility     visibility    not null default 'tribe',
  -- Per-field privacy ("Permission to Show"): { "cell_no": false, "birth_date": true, ... }
  field_visibility jsonb       not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on profiles (industry);
create index on profiles (city);
create index on profiles (status);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Section tables (1:1 and 1:many)
-- ---------------------------------------------------------------------------
create table businesses (
  profile_id   uuid primary key references profiles(id) on delete cascade,
  name         text,
  description  text,
  founded_year int,
  team_size    text,
  website      text
);

create table expertise (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  label      text not null,
  sort_order int  not null default 0
);
create index on expertise (profile_id);

create table offerings (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text,
  sort_order  int not null default 0
);
create index on offerings (profile_id);

create table work_items (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  kind          work_kind not null,
  title         text,
  file_path     text,        -- Supabase Storage path (brochure/image)
  external_url  text,        -- video / case-study link
  thumbnail_url text,
  sort_order    int not null default 0
);
create index on work_items (profile_id);

create table social_links (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  platform   text not null,
  url        text not null,
  sort_order int not null default 0
);
create index on social_links (profile_id);

create table member_open_to (
  profile_id uuid not null references profiles(id) on delete cascade,
  option     open_to_option not null,
  primary key (profile_id, option)
);

create table addresses (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind       address_kind not null,
  line1 text, line2 text, line3 text,
  landmark text, city text, state text, country text, pincode text,
  map_link   text
);
create unique index on addresses (profile_id, kind);   -- one of each kind per member

-- ---------------------------------------------------------------------------
-- Community & content
-- ---------------------------------------------------------------------------
create table announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text,
  author_id    uuid references profiles(id),
  published_at timestamptz,
  created_at   timestamptz not null default now()
);

create table resources (
  id            uuid primary key default gen_random_uuid(),
  kind          resource_kind not null,
  title         text not null,
  description   text,
  file_path     text,
  external_url  text,
  thumbnail_url text,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);

create table spotlights (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references profiles(id) on delete set null,
  title        text not null,
  body         text,
  published_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Private CRM layer (spec A1–A22) — NEVER visible to members
-- ---------------------------------------------------------------------------
create table participant_admin (
  profile_id            uuid primary key references profiles(id) on delete cascade,
  referred_by           text,                                   -- A1
  breakthrough          text,                                   -- A2
  designated_consultant uuid references profiles(id),           -- A11
  rating                rating_tier,                            -- A22
  upsell_possible       boolean not null default false,         -- A12
  impact                jsonb  not null default '{}',            -- A13–A20
  updated_at            timestamptz not null default now()
);
create index on participant_admin (designated_consultant);

create trigger participant_admin_set_updated_at
  before update on participant_admin
  for each row execute function public.set_updated_at();

create table participant_assets (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind       text not null,
  body       text,
  url        text,
  image_path text,
  created_at timestamptz not null default now()
);
create index on participant_assets (profile_id);

create table admin_notes (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  author_id  uuid references profiles(id),
  note       text not null,
  created_at timestamptz not null default now()
);
create index on admin_notes (profile_id);


-- ============================================================
-- 20260719000002_rls.sql
-- ============================================================
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


-- ============================================================
-- 20260719000003_storage.sql
-- ============================================================
-- Altus Tribe — Storage buckets (docs/04-database-schema.md §8)
-- member-photos : public read, self write
-- work-files    : read per profile visibility, self write
-- resources     : tribe read, admin write
--
-- Convention: object paths are prefixed with the owner's profile id, e.g.
-- `member-photos/<profile_id>/hero.jpg`. Policies key off that first path segment.

insert into storage.buckets (id, name, public)
values
  ('member-photos', 'member-photos', true),
  ('work-files',    'work-files',    false),
  ('resources',     'resources',     false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- member-photos — public read, owner (or admin) writes their own folder
-- ---------------------------------------------------------------------------
create policy "member photos public read" on storage.objects for select
  using ( bucket_id = 'member-photos' );

create policy "member photos self write" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'member-photos'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

create policy "member photos self update" on storage.objects for update
  to authenticated
  using (
    bucket_id = 'member-photos'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

create policy "member photos self delete" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'member-photos'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

-- ---------------------------------------------------------------------------
-- work-files — read if the owning profile is visible; owner (or admin) writes
-- ---------------------------------------------------------------------------
create policy "work files visible read" on storage.objects for select
  using (
    bucket_id = 'work-files'
    and public.profile_is_visible( ((storage.foldername(name))[1])::uuid )
  );

create policy "work files self write" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'work-files'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

create policy "work files self update" on storage.objects for update
  to authenticated
  using (
    bucket_id = 'work-files'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

create policy "work files self delete" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'work-files'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

-- ---------------------------------------------------------------------------
-- resources — tribe (authenticated) read, admin write
-- ---------------------------------------------------------------------------
create policy "resources tribe read" on storage.objects for select
  to authenticated using ( bucket_id = 'resources' );

create policy "resources admin write" on storage.objects for insert
  to authenticated with check ( bucket_id = 'resources' and public.is_admin() );

create policy "resources admin update" on storage.objects for update
  to authenticated using ( bucket_id = 'resources' and public.is_admin() );

create policy "resources admin delete" on storage.objects for delete
  to authenticated using ( bucket_id = 'resources' and public.is_admin() );


-- ============================================================
-- 20260719000004_onboarding.sql
-- ============================================================
-- Altus Tribe — P2 onboarding groundwork.
-- 1) Auto-create a profiles row when an auth user signs up.
-- 2) Track onboarding progress so members can resume and we can gate the app.

-- Onboarding tracking columns -----------------------------------------------
alter table profiles
  add column if not exists onboarding_step        int         not null default 0,
  add column if not exists onboarding_completed_at timestamptz;

-- Unique-slug helper: slugify a base string, appending -2, -3, … on collision.
create or replace function public.generate_profile_slug(base text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  root      text;
  candidate text;
  n         int := 1;
begin
  root := regexp_replace(lower(coalesce(nullif(trim(base), ''), 'member')),
                         '[^a-z0-9]+', '-', 'g');
  root := trim(both '-' from root);
  if root = '' then root := 'member'; end if;

  candidate := root;
  while exists (select 1 from profiles where slug = candidate) loop
    n := n + 1;
    candidate := root || '-' || n;
  end loop;
  return candidate;
end;
$$;

-- On new auth user, create their profile with a name + unique slug.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, slug, full_name)
  values (new.id, public.generate_profile_slug(display_name), display_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 20260719000005_profile_fields.sql
-- ============================================================
-- Altus Tribe — P3 schema deltas. Extends profiles to the full Section-2 spec
-- (docs/06 #21–97), widens addresses to 4 lines, and adds admin-editable
-- dropdown taxonomies for category/industry/city/state/country.

-- Profiles: identity, contact, business, personal, program fields ------------
alter table profiles
  add column if not exists first_name           text,
  add column if not exists middle_name          text,
  add column if not exists last_name            text,
  add column if not exists brand_names          text,
  add column if not exists company_logo_url     text,
  add column if not exists cell_no              text,
  add column if not exists alt_no               text,
  add column if not exists work_email           text,
  add column if not exists personal_email       text,
  add column if not exists company_website      text,
  add column if not exists nature_of_business   text,
  add column if not exists usp                  text,
  add column if not exists linkedin_url         text,
  add column if not exists github_url           text,
  add column if not exists business_instagram   text,
  add column if not exists personal_instagram   text,
  add column if not exists youtube_url          text,
  add column if not exists telegram_url         text,
  add column if not exists whatsapp_link        text,
  add column if not exists custom_link          text,
  add column if not exists areas_of_interest    text,
  add column if not exists network_groups       text,   -- associations affiliated with
  add column if not exists can_connect          text,   -- companies you can connect others to
  add column if not exists want_connect         text,   -- companies you want to connect with
  add column if not exists program_benefit_work text,
  add column if not exists program_benefit_personal text,
  add column if not exists favourite_tools      text,
  add column if not exists purpose              text,   -- success mantra / philosophy
  add column if not exists contribution         text,   -- how can you contribute to the tribe
  add column if not exists interested_helping   text,   -- Yes / No / Maybe
  add column if not exists interested_coaching  text,
  add column if not exists interested_networking text,  -- Online / Physical / Both / No
  add column if not exists bss_batch            text,   -- admin-filled (#79)
  add column if not exists conclaves_attended   int;    -- auto from backend (#97)

-- Addresses: fourth line (Area / Sector) -------------------------------------
alter table addresses
  add column if not exists line4 text;

-- Admin-editable dropdown taxonomies -----------------------------------------
create table if not exists taxonomies (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,   -- 'category' | 'industry' | 'city' | 'state' | 'country'
  value      text not null,
  sort_order int  not null default 0,
  unique (kind, value)
);
create index if not exists taxonomies_kind_idx on taxonomies (kind);

alter table taxonomies enable row level security;
create policy "anyone reads taxonomies" on taxonomies for select using ( true );
create policy "admins write taxonomies" on taxonomies for all
  to authenticated using ( public.is_admin() ) with check ( public.is_admin() );

-- Seed a starting set (admin-editable later) ---------------------------------
insert into taxonomies (kind, value, sort_order) values
  ('industry', 'Manufacturing', 0), ('industry', 'Fintech', 1),
  ('industry', 'Design', 2), ('industry', 'Logistics', 3),
  ('industry', 'Technology', 4), ('industry', 'Healthcare', 5),
  ('industry', 'Retail', 6), ('industry', 'Services', 7),
  ('category', 'Products', 0), ('category', 'Services', 1),
  ('category', 'Solutions', 2)
on conflict (kind, value) do nothing;


-- ============================================================
-- 20260721000006_messaging.sql
-- ============================================================
-- Altus Tribe — P5: Messaging & Notifications (docs/11-spec-messaging-notifications.md)
-- Real-time chat (1:1, group, support) + notifications + prefs + web-push subscriptions.
-- Follows the P4 schema conventions: uuid PKs, updated_at trigger, RLS via SECURITY
-- DEFINER helpers to avoid recursion.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type conversation_kind as enum ('direct', 'group', 'support');
create type notification_kind as enum ('message', 'announcement', 'mention', 'referral', 'system');

-- ---------------------------------------------------------------------------
-- Conversations & membership
-- ---------------------------------------------------------------------------
create table conversations (
  id              uuid primary key default gen_random_uuid(),
  kind            conversation_kind not null default 'direct',
  title           text,                                   -- groups only
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index on conversations (last_message_at desc);

create table conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id      uuid not null references profiles(id) on delete cascade,
  role            text not null default 'member',          -- 'member' | 'owner'
  last_read_at    timestamptz not null default now(),
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);
create index on conversation_members (profile_id);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid references profiles(id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now(),
  edited_at       timestamptz,
  deleted_at      timestamptz                              -- soft-delete (moderation #174)
);
create index on messages (conversation_id, created_at);

-- Bump the parent conversation's last_message_at on every new message (list sort).
create or replace function public.bump_conversation()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_bump_conversation
  after insert on messages
  for each row execute function public.bump_conversation();

-- ---------------------------------------------------------------------------
-- Notifications, preferences, push subscriptions
-- ---------------------------------------------------------------------------
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  kind         notification_kind not null,
  title        text not null,
  body         text,
  link         text,                                       -- deep link (e.g. /messages/<id>)
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index on notifications (recipient_id, created_at desc);

create table notification_prefs (
  profile_id     uuid primary key references profiles(id) on delete cascade,
  announcements  boolean not null default true,            -- #152–154
  messages       boolean not null default true,
  mentions       boolean not null default true,
  monthly_digest boolean not null default false,
  updated_at     timestamptz not null default now()
);
create trigger notification_prefs_set_updated_at
  before update on notification_prefs
  for each row execute function public.set_updated_at();

create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  endpoint   text not null unique,                         -- Web Push / FCM endpoint
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index on push_subscriptions (profile_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Is the caller a member of this conversation? (SECURITY DEFINER bypasses RLS so
-- the messages/members policies don't recurse.)
create or replace function public.is_conversation_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = cid and cm.profile_id = auth.uid()
  );
$$;

alter table conversations enable row level security;
create policy "members read their conversations" on conversations for select
  to authenticated using ( public.is_conversation_member(id) or public.is_admin() );
create policy "members create conversations" on conversations for insert
  to authenticated with check ( created_by = auth.uid() or public.is_admin() );
create policy "admins manage conversations" on conversations for all
  to authenticated using ( public.is_admin() ) with check ( public.is_admin() );

alter table conversation_members enable row level security;
create policy "read membership of own conversations" on conversation_members for select
  to authenticated using ( public.is_conversation_member(conversation_id) or public.is_admin() );
create policy "join conversations" on conversation_members for insert
  to authenticated with check ( profile_id = auth.uid() or public.is_conversation_member(conversation_id) or public.is_admin() );
create policy "update own membership" on conversation_members for update
  to authenticated using ( profile_id = auth.uid() ) with check ( profile_id = auth.uid() );

alter table messages enable row level security;
create policy "members read conversation messages" on messages for select
  to authenticated using ( public.is_conversation_member(conversation_id) or public.is_admin() );
create policy "members send as self" on messages for insert
  to authenticated with check ( sender_id = auth.uid() and public.is_conversation_member(conversation_id) );
create policy "edit or delete own messages" on messages for update
  to authenticated using ( sender_id = auth.uid() or public.is_admin() )
  with check ( sender_id = auth.uid() or public.is_admin() );

alter table notifications enable row level security;
create policy "read own notifications" on notifications for select
  to authenticated using ( recipient_id = auth.uid() );
create policy "update own notifications" on notifications for update
  to authenticated using ( recipient_id = auth.uid() ) with check ( recipient_id = auth.uid() );
create policy "admins write notifications" on notifications for insert
  to authenticated with check ( public.is_admin() or recipient_id = auth.uid() );

alter table notification_prefs enable row level security;
create policy "own prefs" on notification_prefs for all
  to authenticated using ( profile_id = auth.uid() ) with check ( profile_id = auth.uid() );

alter table push_subscriptions enable row level security;
create policy "own push subs" on push_subscriptions for all
  to authenticated using ( profile_id = auth.uid() ) with check ( profile_id = auth.uid() );

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;


-- ============================================================
-- 20260721000007_admin.sql
-- ============================================================
-- Altus Tribe — P6: Admin panel & private CRM (docs/12-spec-admin-crm.md)
-- The CRM tables (participant_admin / participant_assets / admin_notes) and their
-- RLS already exist from the P0 schema. P6 only needs one enum delta: a distinct
-- "inactive" member status (#173), separate from "hidden" (#169).
--
-- Note: new enum values can't be used in the same transaction that adds them, so
-- this migration only adds the value; app code uses it in later requests.

alter type member_status add value if not exists 'inactive';


-- ============================================================
-- 20260721000008_fix_profile_autocreate.sql
-- ============================================================
-- Permanent fix for "no profiles row created on signup": re-attach the
-- on_auth_user_created trigger, harden handle_new_user so a failure logs instead
-- of blocking auth, ensure supabase_auth_admin can execute it, and backfill any
-- existing auth users that have no profile. Idempotent + data-preserving.

create or replace function public.generate_profile_slug(base text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  root      text;
  candidate text;
  n         int := 1;
begin
  root := regexp_replace(lower(coalesce(nullif(trim(base), ''), 'member')),
                         '[^a-z0-9]+', '-', 'g');
  root := trim(both '-' from root);
  if root = '' then root := 'member'; end if;

  candidate := root;
  while exists (select 1 from public.profiles where slug = candidate) loop
    n := n + 1;
    candidate := root || '-' || n;
  end loop;
  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1),
    'Member'
  );

  insert into public.profiles (id, slug, full_name)
  values (new.id, public.generate_profile_slug(display_name), display_name)
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_user failed for auth user %: % (SQLSTATE %)',
      new.id, sqlerrm, sqlstate;
    return new;
end;
$$;

grant execute on function public.generate_profile_slug(text) to supabase_auth_admin;
grant execute on function public.handle_new_user()          to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare
  u  record;
  nm text;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    left join public.profiles p on p.id = au.id
    where p.id is null
  loop
    nm := coalesce(
      nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
      split_part(u.email, '@', 1),
      'Member'
    );
    insert into public.profiles (id, slug, full_name)
    values (u.id, public.generate_profile_slug(nm), nm)
    on conflict (id) do nothing;
  end loop;
end $$;


-- ============================================================
-- 20260721000009_pending_signups.sql
-- ============================================================
-- Invitation-only via an admin approval queue: new signups land in `pending`
-- and are held out of the worlds (enforced in proxy/middleware) until an admin
-- approves them from /admin/approvals.

alter type member_status add value if not exists 'pending';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1),
    'Member'
  );

  insert into public.profiles (id, slug, full_name, status)
  values (new.id, public.generate_profile_slug(display_name), display_name, 'pending')
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_user failed for auth user %: % (SQLSTATE %)',
      new.id, sqlerrm, sqlstate;
    return new;
end;
$$;

