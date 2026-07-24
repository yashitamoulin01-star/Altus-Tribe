-- Altus Tribe — Tribe Group Chat (docs/11 + master inventory §E "Instant Group Chat")
-- The conversations / conversation_members / messages schema (migration 0006) already
-- fully supports groups (kind='group', title, create + join RLS). The one policy the
-- original messaging migration omitted is DELETE on conversation_members, which is what
-- "leave group" and admin "remove member" need. Everything else (create group, add
-- members, group messaging, member list) works under the existing 0006 policies.

-- Allow a member to remove their OWN membership row (leave a group); admins may remove
-- anyone (moderation). Group owners removing others is intentionally NOT granted here —
-- keep the surface minimal; revisit if the product needs owner-side removal.
create policy "leave conversations" on conversation_members for delete
  to authenticated using ( profile_id = auth.uid() or public.is_admin() );
