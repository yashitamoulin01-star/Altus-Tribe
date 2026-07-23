-- ============================================================================
-- Altus Tribe — Messaging live-DB diagnostic (READ ONLY, changes nothing)
-- Paste into Supabase SQL Editor and Run. Every row should say ✅.
-- Any ❌ tells you the messaging migrations (0006 / 0013) aren't fully applied.
-- ============================================================================
select 'tables' as check_group, t.name,
       case when to_regclass('public.' || t.name) is not null then '✅ exists' else '❌ MISSING' end as status
from (values ('conversations'), ('conversation_members'), ('messages'),
             ('notifications'), ('notification_prefs'), ('push_subscriptions')) as t(name)

union all
select 'helpers', f.name,
       case when exists (select 1 from pg_proc where proname = f.name) then '✅ exists' else '❌ MISSING' end
from (values ('is_conversation_member'), ('notify_on_message'), ('bump_conversation')) as f(name)

union all
select 'triggers', tg.name,
       case when exists (select 1 from pg_trigger where tgname = tg.name and not tgisinternal) then '✅ exists' else '❌ MISSING' end
from (values ('messages_notify'), ('messages_bump_conversation')) as tg(name)

union all
select 'RLS on messages', 'policies',
       case when (select count(*) from pg_policies where schemaname='public' and tablename='messages') >= 3
            then '✅ ' || (select count(*) from pg_policies where schemaname='public' and tablename='messages') || ' policies'
            else '❌ only ' || (select count(*) from pg_policies where schemaname='public' and tablename='messages') || ' policies' end

union all
select 'realtime', 'messages in publication',
       case when exists (
         select 1 from pg_publication_tables
         where pubname='supabase_realtime' and schemaname='public' and tablename='messages'
       ) then '✅ enabled' else '❌ MISSING' end

order by check_group, name;
