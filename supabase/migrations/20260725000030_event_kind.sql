-- Altus Tribe — Event kind (schedule Referral Rounds via the Events system).
-- Additive + idempotent. Lets admins tag an event as a Referral Round / Conclave /
-- Orientation so member surfaces (Home referral card, Referral Rounds page) can
-- read the right ones. Default 'event' so existing rows are unaffected.

alter table public.events
  add column if not exists kind text not null default 'event';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_kind_valid') then
    alter table public.events
      add constraint events_kind_valid
      check (kind in ('event', 'conclave', 'referral_round', 'orientation'));
  end if;
end $$;

create index if not exists events_kind_starts_idx on public.events (kind, starts_at);
