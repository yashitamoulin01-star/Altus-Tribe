-- Altus Tribe — Level 4: self-serve account deletion without a service-role key.
--
-- A SECURITY DEFINER function lets an authenticated member delete THEIR OWN
-- account: it deletes the auth.users row, which cascades to profiles and every
-- child table (profiles.id references auth.users on delete cascade). Guarded by
-- auth.uid() so a caller can only ever delete themselves.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- Only signed-in users may call it; never anon.
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
