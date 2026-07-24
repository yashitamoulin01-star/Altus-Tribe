-- ============================================================================
-- Altus Tribe — RUN-ALL PENDING DB CHANGES (single, idempotent, safe to re-run)
-- ============================================================================
-- Paste this whole file into the Supabase SQL Editor and Run ONCE.
--
-- It contains ONLY additive / new changes (migrations 0019–0024 + the private
-- crm-assets bucket). It does NOT touch the base schema, so it will NEVER throw
-- "type user_role already exists" like re-running 0001 does.
--
-- Everything here is idempotent: columns use "if not exists", indexes use
-- "if not exists", policies and named constraints are DROPPED then recreated
-- (refreshed), functions use "create or replace", seeds use "on conflict do
-- nothing". Run it as many times as you like — the end state is always the same.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0019 — Approvals: request-changes state + reviewer note (admin-only)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists review_state text,
  add column if not exists review_note  text;

-- refresh the check constraint (drop-then-add so it can't error on re-run)
alter table public.profiles drop constraint if exists profiles_review_state_check;
alter table public.profiles
  add constraint profiles_review_state_check
  check (review_state is null or review_state in ('changes_requested'));

create index if not exists profiles_review_state_idx
  on public.profiles (review_state) where review_state is not null;

-- ---------------------------------------------------------------------------
-- 0020 — Featured member flag
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_featured boolean not null default false;

create index if not exists profiles_is_featured_idx
  on public.profiles (is_featured) where is_featured;

-- ---------------------------------------------------------------------------
-- 0021 — Pin announcements
-- ---------------------------------------------------------------------------
alter table public.announcements
  add column if not exists pinned_at timestamptz;

create index if not exists announcements_pinned_at_idx
  on public.announcements (pinned_at) where pinned_at is not null;

-- ---------------------------------------------------------------------------
-- 0022 — Group chat: allow leaving a group / admin remove (DELETE membership)
-- ---------------------------------------------------------------------------
drop policy if exists "leave conversations" on public.conversation_members;
create policy "leave conversations" on public.conversation_members for delete
  to authenticated
  using ( profile_id = auth.uid() or public.is_admin() );

-- ---------------------------------------------------------------------------
-- 0023 — A22 Participant Classification (multi-select)
-- ---------------------------------------------------------------------------
alter table public.participant_admin
  add column if not exists classifications text[] not null default '{}';

-- refresh the canonical-values check constraint
alter table public.participant_admin
  drop constraint if exists participant_admin_classifications_valid;
alter table public.participant_admin
  add constraint participant_admin_classifications_valid
  check (classifications <@ array[
    'ambassador','mentor','coach','expert','practitioner','observer'
  ]::text[]);

-- backfill from the legacy single rating where nothing is set yet (rating kept)
update public.participant_admin
  set classifications = array[rating]
  where rating is not null
    and (classifications is null or cardinality(classifications) = 0);

-- ---------------------------------------------------------------------------
-- 0024 — Generic global app settings / content control
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  key         text primary key,
  value       text,
  is_public   boolean not null default false,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

alter table public.app_settings enable row level security;

drop policy if exists "read public settings" on public.app_settings;
create policy "read public settings" on public.app_settings for select
  to authenticated
  using (is_public = true or public.is_admin());

drop policy if exists "admin writes settings" on public.app_settings;
create policy "admin writes settings" on public.app_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.app_settings (key, value, is_public) values
  ('featured_video_title', null, true),
  ('featured_video_url',   null, true),
  ('social_youtube',       null, true),
  ('social_instagram',     null, true),
  ('social_facebook',      null, true),
  ('social_linkedin',      null, true),
  ('social_x',             null, true),
  ('ps_orientation_url',   null, true)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Private CRM assets bucket (A3–A9 / A21 evidence images) + access policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('crm-assets', 'crm-assets', false)
on conflict (id) do nothing;

create or replace function public.can_access_crm(participant uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.participant_admin pa
    where pa.profile_id = participant
      and pa.designated_consultant = auth.uid()
  );
$$;

drop policy if exists "crm assets read"   on storage.objects;
create policy "crm assets read" on storage.objects for select
  to authenticated
  using ( bucket_id = 'crm-assets'
          and public.can_access_crm( ((storage.foldername(name))[1])::uuid ) );

drop policy if exists "crm assets write"  on storage.objects;
create policy "crm assets write" on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'crm-assets'
               and public.can_access_crm( ((storage.foldername(name))[1])::uuid ) );

drop policy if exists "crm assets update" on storage.objects;
create policy "crm assets update" on storage.objects for update
  to authenticated
  using ( bucket_id = 'crm-assets'
          and public.can_access_crm( ((storage.foldername(name))[1])::uuid ) );

drop policy if exists "crm assets delete" on storage.objects;
create policy "crm assets delete" on storage.objects for delete
  to authenticated
  using ( bucket_id = 'crm-assets'
          and public.can_access_crm( ((storage.foldername(name))[1])::uuid ) );

commit;

-- ============================================================================
-- Done. If you see "must be owner of table objects" on the crm-assets storage
-- policies, add those 4 via Dashboard → Storage → crm-assets → Policies instead;
-- everything else above will already be applied.
-- ============================================================================
