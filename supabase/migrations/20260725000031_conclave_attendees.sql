-- Altus Tribe — Conclave attendee directory (schema only; NO personal data here).
-- Admin-only table for the Conclave Directory. Attendee rows are loaded via a
-- separate seed that is kept OUT of the public repo (contains PII). Additive +
-- idempotent.

create table if not exists public.conclave_attendees (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  email       text,
  phone       text,
  business    text,
  conclave    text,                 -- edition label, e.g. "April 2026 Contact List"
  created_at  timestamptz not null default now()
);

create index if not exists conclave_attendees_conclave_idx on public.conclave_attendees (conclave);
create index if not exists conclave_attendees_name_idx on public.conclave_attendees (full_name);

alter table public.conclave_attendees enable row level security;

-- Admin-only (contact directory of external attendees — never member-visible).
drop policy if exists "admin manages conclave attendees" on public.conclave_attendees;
create policy "admin manages conclave attendees" on public.conclave_attendees for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
