-- ============================================================================
-- Altus Tribe — Private CRM assets bucket (idempotent / safe to re-run)
-- Creates a PRIVATE `crm-assets` storage bucket for A3–A9 / A21 proof images,
-- readable/writable ONLY by admins and the participant's designated consultant —
-- the same rule as the participant_assets table (never exposed to members).
--
-- Path convention: crm-assets/<participant_profile_id>/<filename>
-- Run once in Supabase SQL Editor. After this, CRM asset image uploads work.
-- ============================================================================

-- 1) The bucket — private (public = false).
insert into storage.buckets (id, name, public)
values ('crm-assets', 'crm-assets', false)
on conflict (id) do nothing;

-- 2) Access helper (SECURITY DEFINER so the storage policy can't recurse):
--    admin, or the designated consultant of the participant whose folder it is.
create or replace function public.can_access_crm(participant uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.participant_admin pa
    where pa.profile_id = participant
      and pa.designated_consultant = auth.uid()
  );
$$;

-- 3) Policies (drop-then-create so re-runs stay clean). folder[1] = participant id.
drop policy if exists "crm assets read"   on storage.objects;
create policy "crm assets read" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'crm-assets'
    and public.can_access_crm( ((storage.foldername(name))[1])::uuid )
  );

drop policy if exists "crm assets write"  on storage.objects;
create policy "crm assets write" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'crm-assets'
    and public.can_access_crm( ((storage.foldername(name))[1])::uuid )
  );

drop policy if exists "crm assets update" on storage.objects;
create policy "crm assets update" on storage.objects for update
  to authenticated
  using (
    bucket_id = 'crm-assets'
    and public.can_access_crm( ((storage.foldername(name))[1])::uuid )
  );

drop policy if exists "crm assets delete" on storage.objects;
create policy "crm assets delete" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'crm-assets'
    and public.can_access_crm( ((storage.foldername(name))[1])::uuid )
  );

-- Done. crm-assets exists and is locked to admins + designated consultants.
