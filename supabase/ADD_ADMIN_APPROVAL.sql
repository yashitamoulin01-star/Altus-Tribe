-- ============================================================
-- Altus Tribe — Admin access approval (two-person security).
-- A profile can have role='admin', but may NOT use admin features until another
-- already-approved admin approves them (admin_approved = true).
-- The founding admin is pre-approved to bootstrap.
-- Idempotent / safe to re-run.
-- ============================================================

alter table public.profiles
  add column if not exists admin_approved boolean not null default false;

-- Pre-approve the founding admin (by email and by known UUID).
update public.profiles p set admin_approved = true
from auth.users u
where u.id = p.id and lower(u.email) = lower('mouliyashita@gmail.com');

update public.profiles set admin_approved = true
where id = 'e0e7e24c-5026-4ead-9e0a-fa5012a48807';

-- Verify (founding admin should show admin_approved = t):
select p.full_name, p.role, p.admin_approved, u.email
from public.profiles p join auth.users u on u.id = p.id
where p.role = 'admin';
