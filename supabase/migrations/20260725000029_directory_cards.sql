-- Altus Tribe — Instagram-style discoverable-but-locked private profiles.
-- Additive + idempotent. Private profiles are fully hidden by profile_is_visible
-- RLS, so a non-connection can't discover them or send a connection request.
-- This SECURITY DEFINER function exposes ONLY safe "card" fields (name, photo,
-- business, category, city — never contact/address/personal/A1–A22 data) for all
-- ACTIVE participants regardless of visibility, so private participants are
-- discoverable and can receive connection requests. Full profile details remain
-- gated by profile_is_visible. Authenticated (invited) users only.

create or replace function public.directory_cards()
returns table (
  id            uuid,
  slug          text,
  full_name     text,
  photo_url     text,
  business_name text,
  category      text,
  industry      text,
  city          text,
  positioning   text,
  visibility    text,
  is_featured   boolean,
  created_at    timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.slug, p.full_name, p.photo_url,
    (select b.name from public.businesses b where b.profile_id = p.id),
    p.category, p.industry, p.city, p.positioning,
    p.visibility::text, p.is_featured, p.created_at
  from public.profiles p
  where p.status = 'active'
  order by p.full_name;
$$;

-- Authenticated members only (the directory is behind auth; the community is
-- invitation-only). Anon keeps the existing public-only profiles policy.
revoke all on function public.directory_cards() from public, anon;
grant execute on function public.directory_cards() to authenticated;
