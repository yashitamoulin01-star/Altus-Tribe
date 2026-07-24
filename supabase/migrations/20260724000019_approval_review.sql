-- Altus Tribe — ADMIN-8: Approvals request-changes + reviewer notes (docs/17 §1).
-- Additive + idempotent. Adds an admin-only review state to the invitation-only
-- approval queue so an applicant can be asked to fix their profile rather than be
-- flatly rejected. Both columns live on profiles; RLS already restricts admin
-- writes and members never read these (never in PROFILE_SELECT / member queries).

alter table profiles
  add column if not exists review_state text
    check (review_state in ('changes_requested')),
  add column if not exists review_note text;

-- Index the small set of flagged applicants for the queue read.
create index if not exists profiles_review_state_idx
  on profiles (review_state) where review_state is not null;
