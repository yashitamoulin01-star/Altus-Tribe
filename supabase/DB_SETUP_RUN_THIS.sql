-- ============================================================
-- Altus Tribe — ONE-SHOT DB SETUP (idempotent, safe to re-run)
-- Catch-up migrations 0012–0017 + Clerk identity 0018.
-- Paste ALL of this into the Supabase SQL editor and Run.
-- Re-running is safe (drops-then-recreates), so "already exists" errors won't stop it.
-- ============================================================

-- ---------- 0012 connections ----------
do $$ begin
  if not exists (select 1 from pg_type where typname='connection_status') then
    create type connection_status as enum ('pending','accepted','declined');
  end if;
end $$;

create table if not exists connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status       connection_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
create index if not exists idx_conn_addressee on connections (addressee_id, status);
create index if not exists idx_conn_requester on connections (requester_id, status);

drop trigger if exists connections_set_updated_at on connections;
create trigger connections_set_updated_at before update on connections
  for each row execute function public.set_updated_at();

alter table connections enable row level security;

-- ---------- 0013 profile_views + notification triggers ----------
create table if not exists profile_views (
  viewer_id  uuid not null references profiles(id) on delete cascade,
  owner_id   uuid not null references profiles(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (viewer_id, owner_id),
  check (viewer_id <> owner_id)
);
create index if not exists idx_pv_owner on profile_views (owner_id, viewed_at desc);
alter table profile_views enable row level security;

create or replace function public.notify_on_message()
returns trigger language plpgsql security definer set search_path=public as $$
declare sender_name text;
begin
  select coalesce(full_name,'A member') into sender_name from profiles where id=new.sender_id;
  insert into notifications (recipient_id, kind, title, body, link)
  select cm.profile_id,'message',sender_name||' sent you a message',left(new.body,140),'/messages/'||new.conversation_id
  from conversation_members cm
  left join notification_prefs np on np.profile_id=cm.profile_id
  where cm.conversation_id=new.conversation_id and cm.profile_id<>new.sender_id
    and coalesce(np.messages,true)=true;
  return new;
end; $$;
drop trigger if exists messages_notify on messages;
create trigger messages_notify after insert on messages for each row execute function public.notify_on_message();

create or replace function public.notify_on_connection()
returns trigger language plpgsql security definer set search_path=public as $$
declare nm text;
begin
  if TG_OP='INSERT' and new.status='pending' then
    select coalesce(full_name,'A member') into nm from profiles where id=new.requester_id;
    insert into notifications (recipient_id,kind,title,link)
    values (new.addressee_id,'system',nm||' wants to connect','/connections');
  elsif TG_OP='UPDATE' and new.status='accepted' and old.status='pending' then
    select coalesce(full_name,'A member') into nm from profiles where id=new.addressee_id;
    insert into notifications (recipient_id,kind,title,link)
    values (new.requester_id,'system',nm||' accepted your connection','/connections');
  end if;
  return new;
end; $$;
drop trigger if exists connections_notify on connections;
create trigger connections_notify after insert or update on connections for each row execute function public.notify_on_connection();

create or replace function public.notify_on_announcement()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.published_at is not null then
    insert into notifications (recipient_id,kind,title,body,link)
    select p.id,'announcement',new.title,left(coalesce(new.body,''),140),'/sacred-space'
    from profiles p left join notification_prefs np on np.profile_id=p.id
    where p.status='active' and coalesce(np.announcements,true)=true;
  end if;
  return new;
end; $$;
drop trigger if exists announcements_notify on announcements;
create trigger announcements_notify after insert on announcements for each row execute function public.notify_on_announcement();

create or replace function public.notify_on_resource()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into notifications (recipient_id,kind,title,link)
  select p.id,'announcement','New in Campus: '||new.title,'/campus'
  from profiles p left join notification_prefs np on np.profile_id=p.id
  where p.status='active' and coalesce(np.announcements,true)=true;
  return new;
end; $$;
drop trigger if exists resources_notify on resources;
create trigger resources_notify after insert on resources for each row execute function public.notify_on_resource();

create or replace function public.notify_on_profile_view()
returns trigger language plpgsql security definer set search_path=public as $$
declare viewer_name text;
begin
  select coalesce(full_name,'A member') into viewer_name from profiles where id=new.viewer_id;
  insert into notifications (recipient_id,kind,title,link)
  values (new.owner_id,'system',viewer_name||' viewed your profile','/notifications');
  return new;
end; $$;
drop trigger if exists profile_views_notify on profile_views;
create trigger profile_views_notify after insert on profile_views for each row execute function public.notify_on_profile_view();

-- ---------- 0014 resource_activity ----------
create table if not exists resource_activity (
  profile_id  uuid not null references profiles(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  bookmarked  boolean not null default false,
  completed   boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (profile_id, resource_id)
);
create index if not exists idx_ra_bookmarked on resource_activity (profile_id) where bookmarked;
drop trigger if exists resource_activity_set_updated_at on resource_activity;
create trigger resource_activity_set_updated_at before update on resource_activity
  for each row execute function public.set_updated_at();
alter table resource_activity enable row level security;

-- ---------- 0015 are_connected ----------
create or replace function public.are_connected(a uuid, b uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.connections c
    where c.status='accepted'
      and ((c.requester_id=a and c.addressee_id=b) or (c.requester_id=b and c.addressee_id=a)));
$$;

-- ---------- 0016 realtime ----------
do $$ begin
  if not exists (select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ---------- 0017 audit_logs ----------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null, entity_type text, entity_id text,
  metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create index if not exists idx_audit_created on audit_logs (created_at desc);
create index if not exists idx_audit_actor on audit_logs (actor_id);
create index if not exists idx_audit_entity on audit_logs (entity_type, entity_id);
alter table audit_logs enable row level security;

-- ============================================================
-- 0018 — Clerk identity
-- ============================================================
alter table public.profiles add column if not exists clerk_id text;
create unique index if not exists profiles_clerk_id_key on public.profiles (clerk_id);

do $$ declare fk text;
begin
  select conname into fk from pg_constraint
  where conrelid='public.profiles'::regclass and contype='f' and confrelid='auth.users'::regclass limit 1;
  if fk is not null then execute format('alter table public.profiles drop constraint %I', fk); end if;
end $$;
alter table public.profiles alter column id set default gen_random_uuid();
drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path=public as $$
  select id from public.profiles where clerk_id = auth.jwt()->>'sub';
$$;

create or replace function public.auth_role()
returns user_role language sql stable security definer set search_path=public as $$
  select role from public.profiles where id = public.current_profile_id(); $$;

create or replace function public.is_conversation_member(cid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.conversation_members cm
    where cm.conversation_id=cid and cm.profile_id=public.current_profile_id()); $$;

create or replace function public.profile_is_visible(pid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.profiles p where p.id=pid and (
    p.id=public.current_profile_id() or public.is_admin()
    or (p.status='active' and p.visibility='public')
    or (auth.role()='authenticated' and p.status='active' and p.visibility='tribe')
    or (auth.role()='authenticated' and p.status='active' and p.visibility='private'
        and public.are_connected(public.current_profile_id(), p.id))
    or exists (select 1 from public.participant_admin pa
        where pa.profile_id=p.id and pa.designated_consultant=public.current_profile_id())));
$$;

-- profiles
drop policy if exists "self edits own profile" on public.profiles;
create policy "self edits own profile" on public.profiles for update to authenticated
  using ( id = public.current_profile_id() ) with check ( id = public.current_profile_id() );
drop policy if exists "tribe reads active members" on public.profiles;
drop policy if exists "members read visible profiles" on public.profiles;
create policy "members read visible profiles" on public.profiles for select to authenticated
  using ( public.profile_is_visible(id) );
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles for all to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );

-- child tables
do $$ declare t text;
begin
  foreach t in array array['businesses','expertise','offerings','work_items','social_links','member_open_to','addresses'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "read visible child" on public.%I', t);
    execute format('create policy "read visible child" on public.%I for select using ( public.profile_is_visible(profile_id) )', t);
    execute format('drop policy if exists "owner or admin writes child" on public.%I', t);
    execute format('create policy "owner or admin writes child" on public.%I for all to authenticated using ( profile_id=public.current_profile_id() or public.is_admin() ) with check ( profile_id=public.current_profile_id() or public.is_admin() )', t);
  end loop;
end $$;

-- messaging
drop policy if exists "members read their conversations" on public.conversations;
create policy "members read their conversations" on public.conversations for select to authenticated using ( public.is_conversation_member(id) or public.is_admin() );
drop policy if exists "members create conversations" on public.conversations;
create policy "members create conversations" on public.conversations for insert to authenticated with check ( created_by=public.current_profile_id() or public.is_admin() );
drop policy if exists "admins manage conversations" on public.conversations;
create policy "admins manage conversations" on public.conversations for all to authenticated using ( public.is_admin() ) with check ( public.is_admin() );

drop policy if exists "read membership of own conversations" on public.conversation_members;
create policy "read membership of own conversations" on public.conversation_members for select to authenticated using ( public.is_conversation_member(conversation_id) or public.is_admin() );
drop policy if exists "join conversations" on public.conversation_members;
create policy "join conversations" on public.conversation_members for insert to authenticated with check ( profile_id=public.current_profile_id() or public.is_conversation_member(conversation_id) or public.is_admin() );
drop policy if exists "update own membership" on public.conversation_members;
create policy "update own membership" on public.conversation_members for update to authenticated using ( profile_id=public.current_profile_id() ) with check ( profile_id=public.current_profile_id() );

drop policy if exists "members read conversation messages" on public.messages;
create policy "members read conversation messages" on public.messages for select to authenticated using ( public.is_conversation_member(conversation_id) or public.is_admin() );
drop policy if exists "members send as self" on public.messages;
create policy "members send as self" on public.messages for insert to authenticated with check ( sender_id=public.current_profile_id() and public.is_conversation_member(conversation_id) );
drop policy if exists "edit or delete own messages" on public.messages;
create policy "edit or delete own messages" on public.messages for update to authenticated using ( sender_id=public.current_profile_id() or public.is_admin() ) with check ( sender_id=public.current_profile_id() or public.is_admin() );

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications for select to authenticated using ( recipient_id=public.current_profile_id() );
drop policy if exists "update own notifications" on public.notifications;
create policy "update own notifications" on public.notifications for update to authenticated using ( recipient_id=public.current_profile_id() ) with check ( recipient_id=public.current_profile_id() );
drop policy if exists "admins write notifications" on public.notifications;
create policy "admins write notifications" on public.notifications for insert to authenticated with check ( public.is_admin() or recipient_id=public.current_profile_id() );

drop policy if exists "own prefs" on public.notification_prefs;
create policy "own prefs" on public.notification_prefs for all to authenticated using ( profile_id=public.current_profile_id() ) with check ( profile_id=public.current_profile_id() );
drop policy if exists "own push subs" on public.push_subscriptions;
create policy "own push subs" on public.push_subscriptions for all to authenticated using ( profile_id=public.current_profile_id() ) with check ( profile_id=public.current_profile_id() );

-- connections
drop policy if exists "see own connections" on public.connections;
create policy "see own connections" on public.connections for select to authenticated using ( requester_id=public.current_profile_id() or addressee_id=public.current_profile_id() or public.is_admin() );
drop policy if exists "send request" on public.connections;
create policy "send request" on public.connections for insert to authenticated with check ( requester_id=public.current_profile_id() );
drop policy if exists "respond to request" on public.connections;
create policy "respond to request" on public.connections for update to authenticated using ( requester_id=public.current_profile_id() or addressee_id=public.current_profile_id() ) with check ( requester_id=public.current_profile_id() or addressee_id=public.current_profile_id() );
drop policy if exists "remove connection" on public.connections;
create policy "remove connection" on public.connections for delete to authenticated using ( requester_id=public.current_profile_id() or addressee_id=public.current_profile_id() );

-- profile_views
drop policy if exists "record own views" on public.profile_views;
create policy "record own views" on public.profile_views for insert to authenticated with check ( viewer_id=public.current_profile_id() );
drop policy if exists "refresh own views" on public.profile_views;
create policy "refresh own views" on public.profile_views for update to authenticated using ( viewer_id=public.current_profile_id() ) with check ( viewer_id=public.current_profile_id() );
drop policy if exists "owner reads views" on public.profile_views;
create policy "owner reads views" on public.profile_views for select to authenticated using ( owner_id=public.current_profile_id() or viewer_id=public.current_profile_id() );

-- campus
drop policy if exists "own resource activity" on public.resource_activity;
create policy "own resource activity" on public.resource_activity for all to authenticated using ( profile_id=public.current_profile_id() ) with check ( profile_id=public.current_profile_id() );

-- CRM
drop policy if exists "crm admin or designated consultant" on public.participant_admin;
create policy "crm admin or designated consultant" on public.participant_admin for all to authenticated using ( public.is_admin() or designated_consultant=public.current_profile_id() ) with check ( public.is_admin() or designated_consultant=public.current_profile_id() );
drop policy if exists "assets admin or designated consultant" on public.participant_assets;
create policy "assets admin or designated consultant" on public.participant_assets for all to authenticated using ( public.is_admin() or exists (select 1 from public.participant_admin pa where pa.profile_id=participant_assets.profile_id and pa.designated_consultant=public.current_profile_id()) ) with check ( public.is_admin() or exists (select 1 from public.participant_admin pa where pa.profile_id=participant_assets.profile_id and pa.designated_consultant=public.current_profile_id()) );
drop policy if exists "notes admin or designated consultant" on public.admin_notes;
create policy "notes admin or designated consultant" on public.admin_notes for all to authenticated using ( public.is_admin() or exists (select 1 from public.participant_admin pa where pa.profile_id=admin_notes.profile_id and pa.designated_consultant=public.current_profile_id()) ) with check ( public.is_admin() or author_id=public.current_profile_id() );

-- audit
drop policy if exists "actor appends own audit" on public.audit_logs;
create policy "actor appends own audit" on public.audit_logs for insert to authenticated with check ( actor_id=public.current_profile_id() );
drop policy if exists "admins read audit" on public.audit_logs;
create policy "admins read audit" on public.audit_logs for select to authenticated using ( public.is_admin() );

-- ============================================================
-- DONE. Verify after signing in with a Clerk user:
--   select public.current_profile_id();   -- should return your profile uuid
-- ============================================================
