-- ============================================================
-- Altus Tribe — server-side upload cap (spec §L). 20 MB per file.
-- Client-side validation lives in lib/storage-client.ts; this enforces it
-- at the storage layer too. Safe / idempotent. Run in the Supabase SQL editor.
-- ============================================================

update storage.buckets
set file_size_limit = 20971520  -- 20 MB in bytes
where id in ('member-photos', 'work-files');

-- Verify:
select id, file_size_limit from storage.buckets
where id in ('member-photos', 'work-files');
