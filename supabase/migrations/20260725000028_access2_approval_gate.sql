-- Altus Tribe — ACCESS-2: re-enable the approval gate + consent columns.
-- New signups land PENDING and must complete onboarding, then an admin approves
-- before they enter the Tribe. Existing members are untouched. Additive/idempotent.

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version   text,
  add column if not exists privacy_version text,
  add column if not exists notif_opt_in    boolean not null default false;

-- Re-define the signup trigger to create profiles as 'pending' (invitation
-- approval gate). Preserves the never-block-signup hardening from migration 0008.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  display_name text;
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1),
    'Member'
  );
  insert into public.profiles (id, slug, full_name, status)
  values (new.id, public.generate_profile_slug(display_name), display_name, 'pending')
  on conflict (id) do nothing;
  return new;
exception
  when others then
    raise warning 'handle_new_user failed for auth user %: % (SQLSTATE %)', new.id, sqlerrm, sqlstate;
    return new;
end;
$$;
