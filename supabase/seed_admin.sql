-- Altus Tribe — seed the FIRST admin (bootstrap).
--
-- Order of operations:
--   1. Run migrations_bundle.sql (builds the schema + trigger).
--   2. Create your account — either sign up in the app, OR in the Supabase
--      dashboard: Authentication → Users → Add user (this fires the trigger and
--      creates a matching profile).
--   3. Run THIS script, with your login email, to promote that account to a
--      full admin (role = admin, status = active — so it skips the pending gate).
--
-- Replace the email below with the address you signed up with.

update public.profiles p
set role = 'admin', status = 'active'
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('mouliyashita@gmail.com');

-- --- Verify it worked (should return your row) ---
select p.full_name, p.role, p.status, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';

-- --- Alternative: if you have exactly one user and don't want to type the email,
-- --- promote the earliest-created auth user instead (uncomment to use):
-- update public.profiles set role = 'admin', status = 'active'
-- where id = (select id from auth.users order by created_at asc limit 1);

-- --- Alternative: seed by known auth UUID (Yashita Mouli). Idempotent: creates
-- --- the profile if missing, otherwise just promotes it. Requires that a matching
-- --- auth.users row exists (profiles.id references auth.users(id)).
insert into public.profiles (id, slug, full_name, role, status)
values (
  'e0e7e24c-5026-4ead-9e0a-fa5012a48807',
  public.generate_profile_slug('Yashita Mouli'),
  'Yashita Mouli',
  'admin',
  'active'
)
on conflict (id) do update
  set role = 'admin', status = 'active';
