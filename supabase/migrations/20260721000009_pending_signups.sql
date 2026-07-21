-- Altus Tribe — Level 1: invitation-only via an admin approval queue.
--
-- New signups land in a `pending` status and are held out of the member worlds
-- (enforced in proxy/middleware) until an admin approves them from /admin/approvals.
-- Existing members and the manually-seeded admin keep their current status.
--
-- Note (Postgres): a new enum value can't be *used* in the same transaction that
-- adds it. We only reference 'pending' inside a plpgsql function body here — that
-- is a string literal evaluated at signup time (a later transaction), not at
-- function-creation time — so adding the value and recreating the function in one
-- migration is safe.

alter type member_status add value if not exists 'pending';

-- New auth users are created pending; an admin promotes them to active.
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

  insert into public.profiles (id, slug, full_name, status)
  values (new.id, public.generate_profile_slug(display_name), display_name, 'pending')
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_user failed for auth user %: % (SQLSTATE %)',
      new.id, sqlerrm, sqlstate;
    return new;
end;
$$;
