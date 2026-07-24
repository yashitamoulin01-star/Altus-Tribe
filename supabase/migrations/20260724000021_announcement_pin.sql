-- Altus Tribe — ADMIN-11: Pin announcements (docs/17 §5). Additive + idempotent.
-- A pinned announcement floats to the top of Sacred Space regardless of publish
-- date, so time-sensitive notes stay visible. Admin-only write rides the existing
-- announcements RLS; members just read the ordering.

alter table announcements
  add column if not exists pinned_at timestamptz;

create index if not exists announcements_pinned_at_idx
  on announcements (pinned_at) where pinned_at is not null;
