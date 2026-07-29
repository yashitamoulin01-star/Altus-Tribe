-- Grant unbarricaded admin access to two owner accounts (2026-07-29).
-- Admins are never gated by onboarding/membership/status (see
-- lib/supabase/middleware.ts: role in ('admin','consultant') => trusted).
-- Idempotent: re-running is a no-op. UPDATE only (rows must already exist from
-- the users having signed in at least once).
--   heteshvichare.altuscorp@gmail.com  33eea231-d469-4a55-abfc-a77496f491bd
--   manan@unleashed.in                 1519201d-0fee-4842-841b-20a439143b76

update public.profiles
set role = 'admin', status = 'active'
where id in (
  '33eea231-d469-4a55-abfc-a77496f491bd',
  '1519201d-0fee-4842-841b-20a439143b76'
);
