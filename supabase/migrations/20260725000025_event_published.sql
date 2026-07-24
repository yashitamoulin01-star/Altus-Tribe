-- Altus Tribe — Events draft/publish state (additive, idempotent).
-- Adds a published flag so admins can prepare an event without members seeing it.
-- Defaults true, so every existing event stays visible (no regression). The Tribe
-- read policy is tightened to published-only (admins still see drafts via is_admin).

alter table public.events
  add column if not exists published boolean not null default true;

create index if not exists events_published_idx on public.events (published);

drop policy if exists "events tribe read" on public.events;
create policy "events tribe read" on public.events for select
  to authenticated
  using ( published or public.is_admin() );
