-- Altus Tribe — Phase 6: audit logging.
-- Immutable trail of security-sensitive actions (member status/role changes,
-- moderation, asset publishing, CRM edits). Written by the acting admin's own
-- session (actor_id = auth.uid()); readable only by admins. No update/delete
-- policies exist, so rows can't be altered or removed by any client.

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,                       -- e.g. 'member.status', 'asset.announcement.create'
  entity_type text,                                -- 'profile' | 'message' | 'announcement' | 'resource' | …
  entity_id   text,                                -- id of the affected entity (text: not always a uuid)
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index on audit_logs (created_at desc);
create index on audit_logs (actor_id);
create index on audit_logs (entity_type, entity_id);

alter table audit_logs enable row level security;

-- Only admins may read the trail.
create policy "admins read audit" on audit_logs for select
  to authenticated using ( public.is_admin() );

-- The acting user may only append rows attributed to themselves.
create policy "actor appends own audit" on audit_logs for insert
  to authenticated with check ( actor_id = auth.uid() );
