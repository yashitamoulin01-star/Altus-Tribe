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
