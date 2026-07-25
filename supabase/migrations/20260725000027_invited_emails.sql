-- Altus Tribe — Invitation-only access (ACCESS-1). Admin-managed allowlist of
-- emails eligible to REGISTER. Additive + idempotent. Existing members already
-- have accounts and log in normally — this gate only affects NEW registrations.

create table if not exists public.invited_emails (
  email       text primary key,
  invited_by  uuid references auth.users(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.invited_emails enable row level security;

-- Admin-only read/write. NO public read — we must never expose whether some
-- other person's email is on the list.
drop policy if exists "admin manages invites" on public.invited_emails;
create policy "admin manages invites" on public.invited_emails for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Eligibility check callable during signup (anon) WITHOUT any table access.
-- Normalizes the email; SECURITY DEFINER bypasses RLS and returns only a boolean
-- for the exact email asked about (no enumeration of the list).
create or replace function public.is_email_invited(check_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.invited_emails
    where email = lower(trim(check_email))
  );
$$;

grant execute on function public.is_email_invited(text) to anon, authenticated;
