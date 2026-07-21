-- Altus Tribe — Phase 5.3: Campus learning activity.
-- Per-member bookmark + completion state for a resource. One row per
-- (member, resource); own rows only.

create table resource_activity (
  profile_id  uuid not null references profiles(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  bookmarked  boolean not null default false,
  completed   boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (profile_id, resource_id)
);
create index on resource_activity (profile_id) where bookmarked;

create trigger resource_activity_set_updated_at
  before update on resource_activity
  for each row execute function public.set_updated_at();

alter table resource_activity enable row level security;
create policy "own resource activity" on resource_activity for all
  to authenticated
  using ( profile_id = auth.uid() )
  with check ( profile_id = auth.uid() );
