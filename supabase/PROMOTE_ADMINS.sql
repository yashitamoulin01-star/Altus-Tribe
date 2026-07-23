-- ============================================================================
-- Altus Tribe — Promote the two founding admins to full ("hardcore") admin.
-- Role-based authz: role='admin' → is_admin() true → access to everything
-- (all admin screens, private CRM, inbox, roster, exports). Idempotent & safe.
-- Run once in the Supabase SQL Editor.
--
-- Edit the email list below if your own admin login differs. Manan is pinned by
-- his auth UUID so it works regardless of email.
-- ============================================================================

-- Manan (by UUID — most reliable).
update public.profiles
   set role = 'admin', status = 'active'
 where id = '083e0166-4752-4d14-89b5-45e0813faa36';

-- Both founders by email (covers your own admin account too). Add/remove emails
-- as needed — only rows that exist are touched.
update public.profiles p
   set role = 'admin', status = 'active'
  from auth.users u
 where u.id = p.id
   and lower(u.email) in (
     'manan@unleashed.in',
     'mouliyashita@gmail.com',
     'altus@carbideindia.com'
   );

-- Verify: list everyone who is now an admin.
select p.id, u.email, p.full_name, p.role, p.status
  from public.profiles p
  join auth.users u on u.id = p.id
 where p.role = 'admin'
 order by u.email;
