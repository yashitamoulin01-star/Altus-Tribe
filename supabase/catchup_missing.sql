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
-- Altus Tribe — Phase 5.2: event-driven notifications.
--
-- Notifications are now created by SECURITY DEFINER triggers on the source
-- tables, not by client-side inserts. This (a) fixes a real bug — the
-- notifications INSERT policy only allows `recipient_id = auth.uid() or
-- is_admin()`, so a member notifying ANOTHER member was silently blocked by RLS
-- — and (b) makes every notification genuinely event-driven and consistent.
-- Recipient notification_prefs are respected; a missing prefs row defaults to on.

-- ---------------------------------------------------------------------------
-- New message → notify the other conversation members (respects prefs.messages)
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
begin
  select coalesce(full_name, 'A member') into sender_name
  from profiles where id = new.sender_id;

  insert into notifications (recipient_id, kind, title, body, link)
  select cm.profile_id, 'message',
         sender_name || ' sent you a message',
         left(new.body, 140),
         '/messages/' || new.conversation_id
  from conversation_members cm
  left join notification_prefs np on np.profile_id = cm.profile_id
  where cm.conversation_id = new.conversation_id
    and cm.profile_id <> new.sender_id
    and coalesce(np.messages, true) = true;
  return new;
end;
$$;

create trigger messages_notify
  after insert on messages
  for each row execute function public.notify_on_message();

-- ---------------------------------------------------------------------------
-- Connection request / accept → notify the counterparty
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_connection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nm text;
begin
  if TG_OP = 'INSERT' and new.status = 'pending' then
    select coalesce(full_name, 'A member') into nm from profiles where id = new.requester_id;
    insert into notifications (recipient_id, kind, title, link)
    values (new.addressee_id, 'system', nm || ' wants to connect', '/connections');
  elsif TG_OP = 'UPDATE' and new.status = 'accepted' and old.status = 'pending' then
    select coalesce(full_name, 'A member') into nm from profiles where id = new.addressee_id;
    insert into notifications (recipient_id, kind, title, link)
    values (new.requester_id, 'system', nm || ' accepted your connection', '/connections');
  end if;
  return new;
end;
$$;

create trigger connections_notify
  after insert or update on connections
  for each row execute function public.notify_on_connection();

-- ---------------------------------------------------------------------------
-- Published announcement → notify all active members (respects prefs.announcements)
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.published_at is not null then
    insert into notifications (recipient_id, kind, title, body, link)
    select p.id, 'announcement', new.title, left(coalesce(new.body, ''), 140), '/sacred-space'
    from profiles p
    left join notification_prefs np on np.profile_id = p.id
    where p.status = 'active' and coalesce(np.announcements, true) = true;
  end if;
  return new;
end;
$$;

create trigger announcements_notify
  after insert on announcements
  for each row execute function public.notify_on_announcement();

-- ---------------------------------------------------------------------------
-- New Campus resource → notify all active members (respects prefs.announcements)
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_resource()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (recipient_id, kind, title, link)
  select p.id, 'announcement', 'New in Campus: ' || new.title, '/campus'
  from profiles p
  left join notification_prefs np on np.profile_id = p.id
  where p.status = 'active' and coalesce(np.announcements, true) = true;
  return new;
end;
$$;

create trigger resources_notify
  after insert on resources
  for each row execute function public.notify_on_resource();

-- ---------------------------------------------------------------------------
-- Profile views → "someone viewed your profile" (once per viewer, first view)
-- ---------------------------------------------------------------------------
create table profile_views (
  viewer_id  uuid not null references profiles(id) on delete cascade,
  owner_id   uuid not null references profiles(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (viewer_id, owner_id),
  check (viewer_id <> owner_id)
);
create index on profile_views (owner_id, viewed_at desc);

alter table profile_views enable row level security;
-- Viewers record their own views; owners can read who viewed them.
create policy "record own views" on profile_views for insert
  to authenticated with check ( viewer_id = auth.uid() );
create policy "refresh own views" on profile_views for update
  to authenticated using ( viewer_id = auth.uid() ) with check ( viewer_id = auth.uid() );
create policy "owner reads views" on profile_views for select
  to authenticated using ( owner_id = auth.uid() or viewer_id = auth.uid() );

-- Notify the owner only on the FIRST view from a given member (re-views just
-- refresh viewed_at via the action's upsert, so no trigger fires).
create or replace function public.notify_on_profile_view()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_name text;
begin
  select coalesce(full_name, 'A member') into viewer_name from profiles where id = new.viewer_id;
  insert into notifications (recipient_id, kind, title, link)
  values (new.owner_id, 'system', viewer_name || ' viewed your profile', '/notifications');
  return new;
end;
$$;

create trigger profile_views_notify
  after insert on profile_views
  for each row execute function public.notify_on_profile_view();
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
-- Altus Tribe — Security Sprint: enforce profile-level visibility in RLS.
--
-- Gap being closed: the authenticated SELECT policy on `profiles` used
-- `status = 'active'`, ignoring the `visibility` column entirely — so a member
-- who set their profile to `private` was still readable by every other member.
-- We make visibility authoritative:
--   public  → anyone (anon web + members)
--   tribe   → authenticated members only
--   private → owner, admins, and accepted connections only
--
-- `profile_is_visible(pid)` is the single source of truth: the profiles SELECT
-- policy and every child-section-table policy (businesses/addresses/…) already
-- call it, so fixing the helper propagates the rule across the whole schema.

-- Are two members mutually connected (accepted request either direction)?
-- SECURITY DEFINER so it can be called from inside a profiles policy without
-- tripping connections RLS or recursing.
create or replace function public.are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.connections c
    where c.status = 'accepted'
      and (
        (c.requester_id = a and c.addressee_id = b)
        or (c.requester_id = b and c.addressee_id = a)
      )
  );
$$;

-- Redefine visibility check to respect the `visibility` enum.
create or replace function public.profile_is_visible(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = pid
      and (
        p.id = auth.uid()                                            -- owner
        or public.is_admin()                                         -- admin
        or (p.status = 'active' and p.visibility = 'public')         -- public / anon
        or (auth.role() = 'authenticated' and p.status = 'active'
              and p.visibility = 'tribe')                            -- tribe members
        or (auth.role() = 'authenticated' and p.status = 'active'
              and p.visibility = 'private'
              and public.are_connected(auth.uid(), p.id))            -- private: connections
        or exists (                                                  -- assigned consultant
              select 1 from public.participant_admin pa
              where pa.profile_id = p.id
                and pa.designated_consultant = auth.uid()
        )
      )
  );
$$;

-- Repoint the authenticated profiles SELECT policy at the (now visibility-aware)
-- helper instead of the old status-only check.
drop policy if exists "tribe reads active members" on profiles;

create policy "members read visible profiles" on profiles for select
  to authenticated using ( public.profile_is_visible(id) );

-- The anon "public reads public members" policy is already correct
-- (status = 'active' and visibility = 'public'); left unchanged.
-- Altus Tribe — enable Supabase Realtime for the in-app notification center.
-- The client subscribes to postgres_changes on `notifications` (scoped to the
-- caller's recipient_id by RLS + the channel filter) for live unread updates.
-- Idempotent: only add the table if it isn't already in the publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
-- Altus Tribe — Phase 6: audit logging.
-- Immutable trail of security-sensitive actions (member status/role changes,
-- moderation, asset publishing, CRM edits). Written by the acting admin's own
-- session (actor_id = auth.uid()); readable only by admins. No update/delete
-- policies exist, so rows can't be altered or removed by any client.

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,                       -- e.g. 'member.status', 'asset.announcement.create'
  entity_type text,                                -- 'profile' | 'message' | 'announcement' | 'resource' | …
  entity_id   text,                                -- id of the affected entity (text: not always a uuid)
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index on audit_logs (created_at desc);
create index on audit_logs (actor_id);
create index on audit_logs (entity_type, entity_id);

alter table audit_logs enable row level security;

-- Only admins may read the trail.
create policy "admins read audit" on audit_logs for select
  to authenticated using ( public.is_admin() );

-- The acting user may only append rows attributed to themselves.
create policy "actor appends own audit" on audit_logs for insert
  to authenticated with check ( actor_id = auth.uid() );
