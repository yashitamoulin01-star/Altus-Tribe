-- Altus Tribe — P3 schema deltas. Extends profiles to the full Section-2 spec
-- (docs/06 #21–97), widens addresses to 4 lines, and adds admin-editable
-- dropdown taxonomies for category/industry/city/state/country.

-- Profiles: identity, contact, business, personal, program fields ------------
alter table profiles
  add column if not exists first_name           text,
  add column if not exists middle_name          text,
  add column if not exists last_name            text,
  add column if not exists brand_names          text,
  add column if not exists company_logo_url     text,
  add column if not exists cell_no              text,
  add column if not exists alt_no               text,
  add column if not exists work_email           text,
  add column if not exists personal_email       text,
  add column if not exists company_website      text,
  add column if not exists nature_of_business   text,
  add column if not exists usp                  text,
  add column if not exists linkedin_url         text,
  add column if not exists business_instagram   text,
  add column if not exists personal_instagram   text,
  add column if not exists youtube_url          text,
  add column if not exists areas_of_interest    text,
  add column if not exists network_groups       text,   -- associations affiliated with
  add column if not exists can_connect          text,   -- companies you can connect others to
  add column if not exists want_connect         text,   -- companies you want to connect with
  add column if not exists program_benefit_work text,
  add column if not exists program_benefit_personal text,
  add column if not exists favourite_tools      text,
  add column if not exists purpose              text,   -- success mantra / philosophy
  add column if not exists contribution         text,   -- how can you contribute to the tribe
  add column if not exists interested_helping   text,   -- Yes / No / Maybe
  add column if not exists interested_coaching  text,
  add column if not exists interested_networking text,  -- Online / Physical / Both / No
  add column if not exists bss_batch            text,   -- admin-filled (#79)
  add column if not exists conclaves_attended   int;    -- auto from backend (#97)

-- Addresses: fourth line (Area / Sector) -------------------------------------
alter table addresses
  add column if not exists line4 text;

-- Admin-editable dropdown taxonomies -----------------------------------------
create table if not exists taxonomies (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,   -- 'category' | 'industry' | 'city' | 'state' | 'country'
  value      text not null,
  sort_order int  not null default 0,
  unique (kind, value)
);
create index if not exists taxonomies_kind_idx on taxonomies (kind);

alter table taxonomies enable row level security;
create policy "anyone reads taxonomies" on taxonomies for select using ( true );
create policy "admins write taxonomies" on taxonomies for all
  to authenticated using ( public.is_admin() ) with check ( public.is_admin() );

-- Seed a starting set (admin-editable later) ---------------------------------
insert into taxonomies (kind, value, sort_order) values
  ('industry', 'Manufacturing', 0), ('industry', 'Fintech', 1),
  ('industry', 'Design', 2), ('industry', 'Logistics', 3),
  ('industry', 'Technology', 4), ('industry', 'Healthcare', 5),
  ('industry', 'Retail', 6), ('industry', 'Services', 7),
  ('category', 'Products', 0), ('category', 'Services', 1),
  ('category', 'Solutions', 2)
on conflict (kind, value) do nothing;
