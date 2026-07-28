-- ═══════════════════════════════════════════════════════════════════════════
-- Altus Tribe — closed-membership access control & admin approval.
--
-- Schema reflects the validated ingestion workflow:
--   • tribe_allowlist               — ONLY clean, email-eligible members.
--   • pending_contact_verification  — incomplete records (no email) awaiting an
--                                     admin to supply one. Never login-eligible.
--   • merge_review                  — identity conflicts (same phone, different
--                                     email) awaiting admin resolution.
--   • import_runs                   — full audit trail of every ingestion.
--   • access_requests               — a member's submitted profile request.
--   • tribe_users                   — created ONLY on approval; links an
--                                     allowlist row to an auth identity.
--
-- Auditing REUSES the existing immutable public.audit_logs table (added `ip`
-- here) rather than creating a second audit table — every privileged action
-- (import, manual_add, approve, reject, suspend, resume_download, whatsapp_click)
-- is logged there.
--
-- No ambiguous or incomplete record is ever promoted into tribe_allowlist.
-- Additive + idempotent. Contains NO personal data (rows loaded via a separate
-- seed kept out of the repo, per the conclave_attendees convention).
--
-- NOTE: authored during a non-infra phase — NOT yet applied to any database.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ── enums ────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.tribe_status as enum
    ('not_requested','requested','approved','rejected','suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_decision as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.review_status as enum ('pending','resolved','dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.import_status as enum ('dry_run','committed','rolled_back');
exception when duplicate_object then null; end $$;

-- ── shared updated_at trigger ────────────────────────────────────────────────
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. tribe_allowlist — clean, email-eligible members only.
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.tribe_allowlist (
  id                       uuid primary key default gen_random_uuid(),
  full_name                text not null,
  email                    citext not null unique,
  phone_e164               text,
  whatsapp_e164            text,                       -- defaults to phone; editable
  company                  text,
  designation              text,
  city                     text,
  state                    text,
  country                  text,
  source_apr_contact       boolean not null default false,
  source_jul_registration  boolean not null default false,
  productivity_shastra_id  uuid,                       -- cross-link (nullable)
  status                   public.tribe_status not null default 'not_requested',
  stale                    boolean not null default false,
  admin_notes              text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
-- whatsapp defaults to the phone when not explicitly set.
create or replace function public.tg_allowlist_defaults()
returns trigger language plpgsql as $$
begin
  if new.whatsapp_e164 is null then new.whatsapp_e164 := new.phone_e164; end if;
  return new;
end $$;
drop trigger if exists allowlist_defaults on public.tribe_allowlist;
create trigger allowlist_defaults before insert or update on public.tribe_allowlist
  for each row execute function public.tg_allowlist_defaults();
drop trigger if exists allowlist_touch on public.tribe_allowlist;
create trigger allowlist_touch before update on public.tribe_allowlist
  for each row execute function public.tg_set_updated_at();

create index if not exists tribe_allowlist_status_idx on public.tribe_allowlist (status);
create index if not exists tribe_allowlist_ps_idx     on public.tribe_allowlist (productivity_shastra_id);
create index if not exists tribe_allowlist_stale_idx  on public.tribe_allowlist (stale);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. pending_contact_verification — incomplete (no-email) records.
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.pending_contact_verification (
  id                       uuid primary key default gen_random_uuid(),
  full_name                text not null,
  phone_e164               text,
  whatsapp_e164            text,
  company                  text,
  source_apr_contact       boolean not null default false,
  source_jul_registration  boolean not null default false,
  confidence               text,
  flags                    text,
  review_reason            text not null default 'no_email',
  resolved                 boolean not null default false,
  resolved_email           citext,                     -- email an admin supplies
  resolved_by              uuid references public.profiles(id),
  resolved_at              timestamptz,
  promoted_allowlist_id    uuid references public.tribe_allowlist(id),
  admin_notes              text,
  created_at               timestamptz not null default now()
);
create index if not exists pending_contact_resolved_idx on public.pending_contact_verification (resolved);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. merge_review — identity conflicts (same phone, different email).
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.merge_review (
  id            uuid primary key default gen_random_uuid(),
  conflict_type text not null default 'phone',         -- 'phone' | 'name' | ...
  match_key     text not null,                          -- e.g. the shared phone
  candidates    jsonb not null,                         -- array of conflicting rows
  status        public.review_status not null default 'pending',
  resolution    jsonb,                                  -- admin decision detail
  resolved_by   uuid references public.profiles(id),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists merge_review_status_idx on public.merge_review (status);
create index if not exists merge_review_key_idx     on public.merge_review (match_key);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. import_runs — audit trail of every ingestion.
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.import_runs (
  id                     uuid primary key default gen_random_uuid(),
  source                 text not null,                 -- 'April PDF' | 'July PDF' | 'CSV/XLSX'
  imported_by            uuid references public.profiles(id),
  total_parsed           integer not null default 0,
  imported_successfully  integer not null default 0,
  sent_to_review         integer not null default 0,
  merge_conflicts        integer not null default 0,
  validation_warnings    integer not null default 0,
  status                 public.import_status not null default 'dry_run',
  diff                   jsonb,                          -- full dry-run diff snapshot
  created_at             timestamptz not null default now()
);
create index if not exists import_runs_created_idx on public.import_runs (created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. access_requests — a member's submitted profile request.
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.access_requests (
  id               uuid primary key default gen_random_uuid(),
  allowlist_id     uuid references public.tribe_allowlist(id) on delete set null,
  email_submitted  citext not null,
  payload          jsonb,                                -- full form submission
  resume_path      text,                                 -- PRIVATE bucket key, never a public URL
  linkedin_url     text,
  bio              text,
  geography        text,
  history          text,
  requested_at     timestamptz not null default now(),
  decision         public.request_decision not null default 'pending',
  decided_at       timestamptz,
  decided_by       uuid references public.profiles(id),
  rejection_reason text
);
create index if not exists access_requests_decision_idx  on public.access_requests (decision, requested_at);
create index if not exists access_requests_allowlist_idx on public.access_requests (allowlist_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. tribe_users — created ONLY on approval; links allowlist ↔ auth identity.
--    Every session must re-check tribe_allowlist.status = 'approved', so
--    revoking access is a status change, never a delete (see tribe_access_ok).
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.tribe_users (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  allowlist_id uuid not null references public.tribe_allowlist(id),
  created_at   timestamptz not null default now(),
  unique (allowlist_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. Auditing — REUSE the existing immutable public.audit_logs table; add the
--    `ip` column the access-control flow needs. (No second audit table.)
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.audit_logs add column if not exists ip text;

-- ═══════════════════════════════════════════════════════════════════════════
-- Helper functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Session gate: is this (approved) user still allowed in? Re-checked per session.
create or replace function public.tribe_access_ok(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tribe_users tu
    join public.tribe_allowlist a on a.id = tu.allowlist_id
    where tu.user_id = p_user and a.status = 'approved'
  );
$$;

-- Anti-enumeration email check. SECURITY DEFINER so it can read the allowlist
-- without granting the caller table access. Returns the allowlist id ONLY on a
-- real, non-suspended match — the API layer sends the SAME response regardless,
-- so the Request Access screen can never enumerate the Conclave list.
create or replace function public.allowlist_match_for_request(p_email citext)
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.tribe_allowlist
  where email = p_email and status <> 'suspended' and stale = false
  limit 1;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS — every table admin-only, except the tribe session-status path.
-- (The email-check + magic-link + provisioning run server-side via SECURITY
--  DEFINER / service role, never through these member-facing policies.)
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.tribe_allowlist              enable row level security;
alter table public.pending_contact_verification enable row level security;
alter table public.merge_review                 enable row level security;
alter table public.import_runs                  enable row level security;
alter table public.access_requests              enable row level security;
alter table public.tribe_users                  enable row level security;
-- (public.audit_logs already has RLS + policies from 20260721000017.)

-- Admin manages everything.
do $$
declare t text;
begin
  foreach t in array array[
    'tribe_allowlist','pending_contact_verification','merge_review',
    'import_runs','access_requests','tribe_users'
  ] loop
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format(
      'create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- A member may read their OWN tribe_users link (for the session gate) and their
-- OWN access request — nothing else.
drop policy if exists "self reads tribe_user" on public.tribe_users;
create policy "self reads tribe_user" on public.tribe_users for select
  to authenticated using (user_id = auth.uid());

drop policy if exists "self reads own request" on public.access_requests;
create policy "self reads own request" on public.access_requests for select
  to authenticated using (email_submitted = (auth.jwt() ->> 'email')::citext);
