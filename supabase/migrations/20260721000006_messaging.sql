-- Altus Tribe — P5: Messaging & Notifications (docs/11-spec-messaging-notifications.md)
-- Real-time chat (1:1, group, support) + notifications + prefs + web-push subscriptions.
-- Follows the P4 schema conventions: uuid PKs, updated_at trigger, RLS via SECURITY
-- DEFINER helpers to avoid recursion.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type conversation_kind as enum ('direct', 'group', 'support');
create type notification_kind as enum ('message', 'announcement', 'mention', 'referral', 'system');

-- ---------------------------------------------------------------------------
-- Conversations & membership
-- ---------------------------------------------------------------------------
create table conversations (
  id              uuid primary key default gen_random_uuid(),
  kind            conversation_kind not null default 'direct',
  title           text,                                   -- groups only
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index on conversations (last_message_at desc);

create table conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id      uuid not null references profiles(id) on delete cascade,
  role            text not null default 'member',          -- 'member' | 'owner'
  last_read_at    timestamptz not null default now(),
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);
create index on conversation_members (profile_id);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid references profiles(id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now(),
  edited_at       timestamptz,
  deleted_at      timestamptz                              -- soft-delete (moderation #174)
);
create index on messages (conversation_id, created_at);

-- Bump the parent conversation's last_message_at on every new message (list sort).
create or replace function public.bump_conversation()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_bump_conversation
  after insert on messages
  for each row execute function public.bump_conversation();

-- ---------------------------------------------------------------------------
-- Notifications, preferences, push subscriptions
-- ---------------------------------------------------------------------------
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  kind         notification_kind not null,
  title        text not null,
  body         text,
  link         text,                                       -- deep link (e.g. /messages/<id>)
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index on notifications (recipient_id, created_at desc);

create table notification_prefs (
  profile_id     uuid primary key references profiles(id) on delete cascade,
  announcements  boolean not null default true,            -- #152–154
  messages       boolean not null default true,
  mentions       boolean not null default true,
  monthly_digest boolean not null default false,
  updated_at     timestamptz not null default now()
);
create trigger notification_prefs_set_updated_at
  before update on notification_prefs
  for each row execute function public.set_updated_at();

create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  endpoint   text not null unique,                         -- Web Push / FCM endpoint
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index on push_subscriptions (profile_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Is the caller a member of this conversation? (SECURITY DEFINER bypasses RLS so
-- the messages/members policies don't recurse.)
create or replace function public.is_conversation_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = cid and cm.profile_id = auth.uid()
  );
$$;

alter table conversations enable row level security;
create policy "members read their conversations" on conversations for select
  to authenticated using ( public.is_conversation_member(id) or public.is_admin() );
create policy "members create conversations" on conversations for insert
  to authenticated with check ( created_by = auth.uid() or public.is_admin() );
create policy "admins manage conversations" on conversations for all
  to authenticated using ( public.is_admin() ) with check ( public.is_admin() );

alter table conversation_members enable row level security;
create policy "read membership of own conversations" on conversation_members for select
  to authenticated using ( public.is_conversation_member(conversation_id) or public.is_admin() );
create policy "join conversations" on conversation_members for insert
  to authenticated with check ( profile_id = auth.uid() or public.is_conversation_member(conversation_id) or public.is_admin() );
create policy "update own membership" on conversation_members for update
  to authenticated using ( profile_id = auth.uid() ) with check ( profile_id = auth.uid() );

alter table messages enable row level security;
create policy "members read conversation messages" on messages for select
  to authenticated using ( public.is_conversation_member(conversation_id) or public.is_admin() );
create policy "members send as self" on messages for insert
  to authenticated with check ( sender_id = auth.uid() and public.is_conversation_member(conversation_id) );
create policy "edit or delete own messages" on messages for update
  to authenticated using ( sender_id = auth.uid() or public.is_admin() )
  with check ( sender_id = auth.uid() or public.is_admin() );

alter table notifications enable row level security;
create policy "read own notifications" on notifications for select
  to authenticated using ( recipient_id = auth.uid() );
create policy "update own notifications" on notifications for update
  to authenticated using ( recipient_id = auth.uid() ) with check ( recipient_id = auth.uid() );
create policy "admins write notifications" on notifications for insert
  to authenticated with check ( public.is_admin() or recipient_id = auth.uid() );

alter table notification_prefs enable row level security;
create policy "own prefs" on notification_prefs for all
  to authenticated using ( profile_id = auth.uid() ) with check ( profile_id = auth.uid() );

alter table push_subscriptions enable row level security;
create policy "own push subs" on push_subscriptions for all
  to authenticated using ( profile_id = auth.uid() ) with check ( profile_id = auth.uid() );

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
