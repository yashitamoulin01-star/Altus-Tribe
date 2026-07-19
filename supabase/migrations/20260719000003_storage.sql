-- Altus Tribe — Storage buckets (docs/04-database-schema.md §8)
-- member-photos : public read, self write
-- work-files    : read per profile visibility, self write
-- resources     : tribe read, admin write
--
-- Convention: object paths are prefixed with the owner's profile id, e.g.
-- `member-photos/<profile_id>/hero.jpg`. Policies key off that first path segment.

insert into storage.buckets (id, name, public)
values
  ('member-photos', 'member-photos', true),
  ('work-files',    'work-files',    false),
  ('resources',     'resources',     false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- member-photos — public read, owner (or admin) writes their own folder
-- ---------------------------------------------------------------------------
create policy "member photos public read" on storage.objects for select
  using ( bucket_id = 'member-photos' );

create policy "member photos self write" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'member-photos'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

create policy "member photos self update" on storage.objects for update
  to authenticated
  using (
    bucket_id = 'member-photos'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

create policy "member photos self delete" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'member-photos'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

-- ---------------------------------------------------------------------------
-- work-files — read if the owning profile is visible; owner (or admin) writes
-- ---------------------------------------------------------------------------
create policy "work files visible read" on storage.objects for select
  using (
    bucket_id = 'work-files'
    and public.profile_is_visible( ((storage.foldername(name))[1])::uuid )
  );

create policy "work files self write" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'work-files'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

create policy "work files self update" on storage.objects for update
  to authenticated
  using (
    bucket_id = 'work-files'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

create policy "work files self delete" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'work-files'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

-- ---------------------------------------------------------------------------
-- resources — tribe (authenticated) read, admin write
-- ---------------------------------------------------------------------------
create policy "resources tribe read" on storage.objects for select
  to authenticated using ( bucket_id = 'resources' );

create policy "resources admin write" on storage.objects for insert
  to authenticated with check ( bucket_id = 'resources' and public.is_admin() );

create policy "resources admin update" on storage.objects for update
  to authenticated using ( bucket_id = 'resources' and public.is_admin() );

create policy "resources admin delete" on storage.objects for delete
  to authenticated using ( bucket_id = 'resources' and public.is_admin() );
