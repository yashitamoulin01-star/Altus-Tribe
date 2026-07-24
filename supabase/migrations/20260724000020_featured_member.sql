-- Altus Tribe — ADMIN-9: Featured member flag (docs/17 §6). Additive + idempotent.
-- Admins can spotlight a member; the flag surfaces as a "Featured" strip on Explore
-- and floats them to the top of Home suggestions. Public-facing (part of the active
-- roster), so it rides the existing profiles SELECT visibility — no new policy.

alter table profiles
  add column if not exists is_featured boolean not null default false;

create index if not exists profiles_is_featured_idx
  on profiles (is_featured) where is_featured;
