-- Altus Tribe — ADMIN-7: Events (upcoming / featured, incl. Conclave, Referral
-- Round, PS Orientation). Additive + idempotent so it can be pasted into the
-- Supabase SQL Editor. Tribe (authenticated) read; admin write. RLS is the
-- boundary — no member-writable state.

create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  location    text,
  link        text,                                   -- registration / details URL
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  featured    boolean not null default false,          -- pin to the top / hero
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists events_starts_at_idx on events (starts_at);
create index if not exists events_featured_idx on events (featured, starts_at);

-- updated_at maintenance (set_updated_at() exists from the P0 schema).
drop trigger if exists events_set_updated_at on events;
create trigger events_set_updated_at
  before update on events
  for each row execute function public.set_updated_at();

alter table events enable row level security;

drop policy if exists "events tribe read" on events;
create policy "events tribe read" on events for select
  to authenticated using ( true );

drop policy if exists "events admin write" on events;
create policy "events admin write" on events for all
  to authenticated using ( public.is_admin() ) with check ( public.is_admin() );
