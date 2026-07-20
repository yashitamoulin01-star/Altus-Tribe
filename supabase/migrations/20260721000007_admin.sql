-- Altus Tribe — P6: Admin panel & private CRM (docs/12-spec-admin-crm.md)
-- The CRM tables (participant_admin / participant_assets / admin_notes) and their
-- RLS already exist from the P0 schema. P6 only needs one enum delta: a distinct
-- "inactive" member status (#173), separate from "hidden" (#169).
--
-- Note: new enum values can't be used in the same transaction that adds them, so
-- this migration only adds the value; app code uses it in later requests.

alter type member_status add value if not exists 'inactive';
