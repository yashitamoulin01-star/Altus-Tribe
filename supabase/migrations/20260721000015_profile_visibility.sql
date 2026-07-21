-- Altus Tribe — Security Sprint: enforce profile-level visibility in RLS.
--
-- Gap being closed: the authenticated SELECT policy on `profiles` used
-- `status = 'active'`, ignoring the `visibility` column entirely — so a member
-- who set their profile to `private` was still readable by every other member.
-- We make visibility authoritative:
--   public  → anyone (anon web + members)
--   tribe   → authenticated members only
--   private → owner, admins, and accepted connections only
--
-- `profile_is_visible(pid)` is the single source of truth: the profiles SELECT
-- policy and every child-section-table policy (businesses/addresses/…) already
-- call it, so fixing the helper propagates the rule across the whole schema.

-- Are two members mutually connected (accepted request either direction)?
-- SECURITY DEFINER so it can be called from inside a profiles policy without
-- tripping connections RLS or recursing.
create or replace function public.are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.connections c
    where c.status = 'accepted'
      and (
        (c.requester_id = a and c.addressee_id = b)
        or (c.requester_id = b and c.addressee_id = a)
      )
  );
$$;

-- Redefine visibility check to respect the `visibility` enum.
create or replace function public.profile_is_visible(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = pid
      and (
        p.id = auth.uid()                                            -- owner
        or public.is_admin()                                         -- admin
        or (p.status = 'active' and p.visibility = 'public')         -- public / anon
        or (auth.role() = 'authenticated' and p.status = 'active'
              and p.visibility = 'tribe')                            -- tribe members
        or (auth.role() = 'authenticated' and p.status = 'active'
              and p.visibility = 'private'
              and public.are_connected(auth.uid(), p.id))            -- private: connections
        or exists (                                                  -- assigned consultant
              select 1 from public.participant_admin pa
              where pa.profile_id = p.id
                and pa.designated_consultant = auth.uid()
        )
      )
  );
$$;

-- Repoint the authenticated profiles SELECT policy at the (now visibility-aware)
-- helper instead of the old status-only check.
drop policy if exists "tribe reads active members" on profiles;

create policy "members read visible profiles" on profiles for select
  to authenticated using ( public.profile_is_visible(id) );

-- The anon "public reads public members" policy is already correct
-- (status = 'active' and visibility = 'public'); left unchanged.
