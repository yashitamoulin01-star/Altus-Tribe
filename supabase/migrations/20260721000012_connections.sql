-- Altus Tribe — Phase 5 (Tribe): member connection requests.
-- A directed request (requester → addressee) that becomes a mutual connection
-- when accepted. Powers "Connect", the requests inbox, and connection counts.

create type connection_status as enum ('pending', 'accepted', 'declined');

create table connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status       connection_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
create index on connections (addressee_id, status);
create index on connections (requester_id, status);

create trigger connections_set_updated_at
  before update on connections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — only the two participants (or an admin) touch a row.
-- ---------------------------------------------------------------------------
alter table connections enable row level security;

create policy "see own connections" on connections for select
  to authenticated
  using ( requester_id = auth.uid() or addressee_id = auth.uid() or public.is_admin() );

-- You may only create a request as yourself.
create policy "send request" on connections for insert
  to authenticated
  with check ( requester_id = auth.uid() );

-- Either participant may update (addressee accepts/declines; requester can
-- withdraw by setting declined). Row stays owned by the same two people.
create policy "respond to request" on connections for update
  to authenticated
  using ( requester_id = auth.uid() or addressee_id = auth.uid() )
  with check ( requester_id = auth.uid() or addressee_id = auth.uid() );

create policy "remove connection" on connections for delete
  to authenticated
  using ( requester_id = auth.uid() or addressee_id = auth.uid() );
