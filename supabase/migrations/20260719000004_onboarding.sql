-- Altus Tribe — P2 onboarding groundwork.
-- 1) Auto-create a profiles row when an auth user signs up.
-- 2) Track onboarding progress so members can resume and we can gate the app.

-- Onboarding tracking columns -----------------------------------------------
alter table profiles
  add column if not exists onboarding_step        int         not null default 0,
  add column if not exists onboarding_completed_at timestamptz;

-- Unique-slug helper: slugify a base string, appending -2, -3, … on collision.
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
  while exists (select 1 from profiles where slug = candidate) loop
    n := n + 1;
    candidate := root || '-' || n;
  end loop;
  return candidate;
end;
$$;

-- On new auth user, create their profile with a name + unique slug.
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
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, slug, full_name)
  values (new.id, public.generate_profile_slug(display_name), display_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
