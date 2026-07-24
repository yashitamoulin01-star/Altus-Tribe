-- Altus Tribe — A22 Participant Classification as MULTI-SELECT (additive, safe to re-run).
--
-- Previous model: participant_admin.rating (a single RatingTier). A22 is actually
-- a MULTI-SELECT — a participant may be several at once (e.g. Ambassador + Mentor
-- + Expert). This ADDS a classifications text[] and PRESERVES the old rating
-- column (no data loss). The app now reads/writes classifications; rating is kept
-- only for backward compatibility.

-- 1) Additive column, defaulted so existing rows are valid immediately.
alter table public.participant_admin
  add column if not exists classifications text[] not null default '{}';

-- 2) The DATABASE is the authority: only canonical A22 values may ever be stored
--    (UI validation is UX only). `<@` = "is contained by" the canonical set.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'participant_admin_classifications_valid'
  ) then
    alter table public.participant_admin
      add constraint participant_admin_classifications_valid
      check (classifications <@ array[
        'ambassador','mentor','coach','expert','practitioner','observer'
      ]::text[]);
  end if;
end $$;

-- 3) Backfill: the old single rating vocabulary is IDENTICAL to the new one, so
--    seed classifications from rating where nothing is set yet. Only touches rows
--    with an empty array → idempotent, and rating is left untouched.
update public.participant_admin
  set classifications = array[rating]
  where rating is not null
    and (classifications is null or cardinality(classifications) = 0);

-- Done. A22 is now multi-select; rating preserved for backward compatibility.
