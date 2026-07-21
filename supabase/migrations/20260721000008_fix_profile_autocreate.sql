-- Altus Tribe — permanent fix for "no profiles row created on signup".
--
-- Root cause (see the message that shipped this migration): the SECURITY DEFINER
-- functions `handle_new_user` / `generate_profile_slug` exist and work on the live
-- DB, but the `on_auth_user_created` trigger was not actually attached to
-- `auth.users` (a trigger that erred would abort signup with "Database error
-- saving new user"; instead signup succeeds and the user IS created, so the
-- trigger simply never runs). This migration re-attaches the trigger, hardens the
-- function so a future failure logs instead of blocking auth, ensures GoTrue's
-- role can execute it, and backfills any existing users who never got a profile.
--
-- Idempotent and data-preserving: safe to run repeatedly.

-- 1) Harden the slug helper (unchanged behaviour, explicit and defensive). --------
create or replace function public.generate_profile_slug(base text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  root      text;
  candidate text;
  n         int := 1;
begin
  root := regexp_replace(lower(coalesce(nullif(trim(base), ''), 'member')),
                         '[^a-z0-9]+', '-', 'g');
  root := trim(both '-' from root);
  if root = '' then root := 'member'; end if;

  candidate := root;
  while exists (select 1 from public.profiles where slug = candidate) loop
    n := n + 1;
    candidate := root || '-' || n;
  end loop;
  return candidate;
end;
$$;

-- 2) Harden handle_new_user: NEVER block auth signup; log failures to Postgres. ---
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1),
    'Member'
  );

  insert into public.profiles (id, slug, full_name)
  values (new.id, public.generate_profile_slug(display_name), display_name)
  on conflict (id) do nothing;

  return new;
exception
  when others then
    -- Profile creation must never break the auth signup. Surface the real error
    -- in the Postgres logs (Dashboard → Logs → Postgres) so it is debuggable.
    raise warning 'handle_new_user failed for auth user %: % (SQLSTATE %)',
      new.id, sqlerrm, sqlstate;
    return new;
end;
$$;

-- 3) Make sure GoTrue's role can run the functions (covers the case where the
--    default PUBLIC execute grant was revoked). Harmless if already present. -----
grant execute on function public.generate_profile_slug(text) to supabase_auth_admin;
grant execute on function public.handle_new_user()          to supabase_auth_admin;

-- 4) (Re)attach the trigger. This is the actual fix — drop-if-exists then create
--    guarantees a correct binding whether it was missing, stale, or disabled. ----
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Backfill: create a profile for every existing auth user that has none.
--    Row-by-row so generate_profile_slug sees prior inserts and avoids slug
--    collisions within this run. Existing profiles are left untouched. ----------
do $$
declare
  u  record;
  nm text;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    left join public.profiles p on p.id = au.id
    where p.id is null
  loop
    nm := coalesce(
      nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
      split_part(u.email, '@', 1),
      'Member'
    );
    insert into public.profiles (id, slug, full_name)
    values (u.id, public.generate_profile_slug(nm), nm)
    on conflict (id) do nothing;
  end loop;
end $$;
