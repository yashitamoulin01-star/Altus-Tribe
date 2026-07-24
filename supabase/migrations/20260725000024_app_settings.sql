-- Altus Tribe — Generic global app settings / content control (additive, safe to re-run).
--
-- ONE canonical key/value store for operational content Admin must change without
-- a deploy (featured video, social channels, PS orientation link, …). NOT one
-- column per network. is_public distinguishes member-readable config from
-- admin-only config so secrets/internal config can never leak by simply existing.
-- NEVER store API secrets / service-role / OAuth secrets here.

create table if not exists public.app_settings (
  key         text primary key,
  value       text,
  is_public   boolean not null default false,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

alter table public.app_settings enable row level security;

-- Read: any authenticated user may read PUBLIC settings; admins read everything.
drop policy if exists "read public settings" on public.app_settings;
create policy "read public settings" on public.app_settings for select
  to authenticated
  using (is_public = true or public.is_admin());

-- Write: admins only (all operations).
drop policy if exists "admin writes settings" on public.app_settings;
create policy "admin writes settings" on public.app_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed the canonical PUBLIC keys with empty values (admins fill them in-app).
-- Idempotent — existing values are never overwritten.
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

-- Done. Generic app_settings live; admins write, members read public keys.
