-- ============================================================================
-- Altus Tribe — Apply messaging schema (idempotent / safe to re-run)
-- Run this ONLY if VERIFY_MESSAGING.sql showed any ❌. It re-creates the
-- messaging tables, RLS, helper, notification trigger and realtime hookup
-- from migrations 0006 + 0013. Every statement is guarded so re-running is safe.
-- Additive only — it never drops data.
-- ============================================================================

-- ---- Enums (guarded) -------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'conversation_kind') then
    create type conversation_kind as enum ('direct', 'group', 'support');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_kind') then
    create type notification_kind as enum ('message', 'announcement', 'mention', 'referral', 'system');
  end if;
end $$;

-- ---- Tables ----------------------------------------------------------------
create table if not exists conversations (
  id              uuid primary key default gen_random_uuid(),
  kind            conversation_kind not null default 'direct',
  title           text,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index if not exists conversations_last_message_at_idx on conversations (last_message_at desc);

create table if not exists conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id      uuid not null references profiles(id) on delete cascade,
  role            text not null default 'member',
  last_read_at    timestamptz not null default now(),
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);
create index if not exists conversation_members_profile_id_idx on conversation_members (profile_id);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid references profiles(id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now(),
  edited_at       timestamptz,
  deleted_at      timestamptz
);
create index if not exists messages_conversation_created_idx on messages (conversation_id, created_at);

create table if not exists notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  kind         notification_kind not null,
  title        text not null,
  body         text,
  link         text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists notifications_recipient_idx on notifications (recipient_id, created_at desc);

create table if not exists notification_prefs (
  profile_id     uuid primary key references profiles(id) on delete cascade,
  announcements  boolean not null default true,
  messages       boolean not null default true,
  mentions       boolean not null default true,
  monthly_digest boolean not null default false,
  updated_at     timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_profile_idx on push_subscriptions (profile_id);

-- ---- Helper: is the caller a member of this conversation? ------------------
create or replace function public.is_conversation_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = cid and cm.profile_id = auth.uid()
  );
$$;

-- ---- Trigger: bump conversation.last_message_at on new message -------------
create or replace function public.bump_conversation()
returns trigger language plpgsql as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end; $$;
drop trigger if exists messages_bump_conversation on messages;
create trigger messages_bump_conversation after insert on messages
  for each row execute function public.bump_conversation();

-- ---- Trigger: notify other members on new message -------------------------
create or replace function public.notify_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare sender_name text;
begin
  select coalesce(full_name, 'A member') into sender_name from profiles where id = new.sender_id;
  insert into notifications (recipient_id, kind, title, body, link)
  select cm.profile_id, 'message', sender_name || ' sent you a message',
         left(new.body, 140), '/messages/' || new.conversation_id
  from conversation_members cm
  left join notification_prefs np on np.profile_id = cm.profile_id
  where cm.conversation_id = new.conversation_id
    and cm.profile_id <> new.sender_id
    and coalesce(np.messages, true) = true;
  return new;
end; $$;
drop trigger if exists messages_notify on messages;
create trigger messages_notify after insert on messages
  for each row execute function public.notify_on_message();

-- ---- RLS (drop-then-create each policy so re-runs are clean) ---------------
alter table conversations         enable row level security;
alter table conversation_members  enable row level security;
alter table messages              enable row level security;
alter table notifications         enable row level security;
alter table notification_prefs    enable row level security;
alter table push_subscriptions    enable row level security;

drop policy if exists "members read their conversations" on conversations;
create policy "members read their conversations" on conversations for select
  to authenticated using ( public.is_conversation_member(id) or public.is_admin() );
drop policy if exists "members create conversations" on conversations;
create policy "members create conversations" on conversations for insert
  to authenticated with check ( created_by = auth.uid() or public.is_admin() );
drop policy if exists "admins manage conversations" on conversations;
create policy "admins manage conversations" on conversations for all
  to authenticated using ( public.is_admin() ) with check ( public.is_admin() );

drop policy if exists "read membership of own conversations" on conversation_members;
create policy "read membership of own conversations" on conversation_members for select
  to authenticated using ( public.is_conversation_member(conversation_id) or public.is_admin() );
drop policy if exists "join conversations" on conversation_members;
create policy "join conversations" on conversation_members for insert
  to authenticated with check ( profile_id = auth.uid() or public.is_conversation_member(conversation_id) or public.is_admin() );
drop policy if exists "update own membership" on conversation_members;
create policy "update own membership" on conversation_members for update
  to authenticated using ( profile_id = auth.uid() ) with check ( profile_id = auth.uid() );

drop policy if exists "members read conversation messages" on messages;
create policy "members read conversation messages" on messages for select
  to authenticated using ( public.is_conversation_member(conversation_id) or public.is_admin() );
drop policy if exists "members send as self" on messages;
create policy "members send as self" on messages for insert
  to authenticated with check ( sender_id = auth.uid() and public.is_conversation_member(conversation_id) );
drop policy if exists "edit or delete own messages" on messages;
create policy "edit or delete own messages" on messages for update
  to authenticated using ( sender_id = auth.uid() or public.is_admin() )
  with check ( sender_id = auth.uid() or public.is_admin() );

drop policy if exists "read own notifications" on notifications;
create policy "read own notifications" on notifications for select
  to authenticated using ( recipient_id = auth.uid() );
drop policy if exists "update own notifications" on notifications;
create policy "update own notifications" on notifications for update
  to authenticated using ( recipient_id = auth.uid() ) with check ( recipient_id = auth.uid() );
drop policy if exists "admins write notifications" on notifications;
create policy "admins write notifications" on notifications for insert
  to authenticated with check ( public.is_admin() or recipient_id = auth.uid() );

drop policy if exists "own prefs" on notification_prefs;
create policy "own prefs" on notification_prefs for all
  to authenticated using ( profile_id = auth.uid() ) with check ( profile_id = auth.uid() );

drop policy if exists "own push subs" on push_subscriptions;
create policy "own push subs" on push_subscriptions for all
  to authenticated using ( profile_id = auth.uid() ) with check ( profile_id = auth.uid() );

-- ---- Realtime (guarded: adding a table twice errors otherwise) ------------
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- Done. Re-run VERIFY_MESSAGING.sql — everything should now show ✅.
