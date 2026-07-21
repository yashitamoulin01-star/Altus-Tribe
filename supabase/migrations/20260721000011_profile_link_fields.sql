-- Altus Tribe — add the extra presence/link columns the edit form already writes.
--
-- Bug fix: saveProfile (account/edit/actions.ts) and loadEditable
-- (lib/profile-edit.ts) read/write github_url, telegram_url, whatsapp_link, and
-- custom_link, but no migration ever created them. On the live DB every profile
-- save would fail with "column ... does not exist" (42703). These back the
-- "Presence" section fields (GitHub / Telegram / WhatsApp link / Other link)
-- that sit alongside the spec socials (LinkedIn #24, IG #25/#26, YouTube #27).
--
-- Idempotent and additive.

alter table profiles
  add column if not exists github_url    text,
  add column if not exists telegram_url  text,
  add column if not exists whatsapp_link text,
  add column if not exists custom_link   text;
