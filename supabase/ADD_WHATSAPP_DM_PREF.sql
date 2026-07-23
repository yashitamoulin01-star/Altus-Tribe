-- ============================================================
-- Altus Tribe — WhatsApp DM preference (Yes / No / DND).
-- Additive & non-destructive: adds whatsapp_dm_pref, backfills from the existing
-- whatsapp_dm boolean, and KEEPS the boolean for backward compatibility (it can
-- be dropped later in a dedicated cleanup migration). Safe / idempotent.
-- Run in the Supabase SQL editor.
-- ============================================================

alter table public.profiles
  add column if not exists whatsapp_dm_pref text
  check (whatsapp_dm_pref in ('yes','no','dnd'));

-- Backfill only rows that don't have a preference yet.
update public.profiles
set whatsapp_dm_pref = case when whatsapp_dm then 'yes' else 'no' end
where whatsapp_dm_pref is null;

-- Verify:
select whatsapp_dm, whatsapp_dm_pref, count(*)
from public.profiles group by 1, 2;
