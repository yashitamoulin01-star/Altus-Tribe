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
