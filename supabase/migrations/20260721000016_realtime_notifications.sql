-- Altus Tribe — enable Supabase Realtime for the in-app notification center.
-- The client subscribes to postgres_changes on `notifications` (scoped to the
-- caller's recipient_id by RLS + the channel filter) for live unread updates.
-- Idempotent: only add the table if it isn't already in the publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
