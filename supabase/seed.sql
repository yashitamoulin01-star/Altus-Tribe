-- Altus Tribe — local dev seed.
-- Mirrors src/lib/members.ts sample data. Creates auth.users first (profiles FK to them),
-- then profiles + child section rows. Password for every seeded account: "altus-dev".
--
-- Run automatically by `supabase db reset`. NOT for production.

do $$
declare
  yashita uuid := '00000000-0000-0000-0000-000000000001';
  arjun   uuid := '00000000-0000-0000-0000-000000000002';
  priya   uuid := '00000000-0000-0000-0000-000000000003';
  rohan   uuid := '00000000-0000-0000-0000-000000000004';
  pw      text := crypt('altus-dev', gen_salt('bf'));
begin
  -- auth users -------------------------------------------------------------
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data)
  values
    ('00000000-0000-0000-0000-000000000000', yashita, 'authenticated', 'authenticated',
      'yashita@greenwrap.in', pw, now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000000', arjun, 'authenticated', 'authenticated',
      'arjun@ledgerloop.com', pw, now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000000', priya, 'authenticated', 'authenticated',
      'priya@northlight.studio', pw, now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000000', rohan, 'authenticated', 'authenticated',
      'rohan@crateroute.in', pw, now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}')
  on conflict (id) do nothing;

  -- profiles ---------------------------------------------------------------
  insert into profiles (id, slug, full_name, role_title, industry, city, positioning, known_for, about, role) values
    (yashita, 'yashita-mouli', 'Yashita Mouli', 'Founder', 'Manufacturing', 'Mumbai',
      'Helping Indian manufacturers build sustainable export businesses.',
      'Built India''s first fully compostable FMCG packaging line.',
      'Yashita left a corporate supply-chain role in 2018 to prove that sustainable packaging could be profitable, not just principled. Today GreenWrap supplies compostable packaging to FMCG brands across three continents — and she''s still the person who walks the factory floor every morning.',
      'admin'),
    (arjun, 'arjun-nair', 'Arjun Nair', 'Founder', 'Fintech', 'Bengaluru',
      'Making working-capital credit reach India''s small merchants in minutes, not weeks.',
      'Underwrote ₹500 Cr in merchant credit with a 12-person team.',
      'Arjun spent six years inside a large bank watching good businesses get turned away for want of a credit history. LedgerLoop reads a merchant''s real cash flow instead of their paperwork — and approves in the time it takes to make chai.',
      'member'),
    (priya, 'priya-deshmukh', 'Priya Deshmukh', 'Creative Director', 'Design', 'Pune',
      'Turning founder stories into brands people actually remember.',
      'Rebranded 40+ D2C labels; three became category leaders.',
      'Priya believes a brand is a promise kept in public. Her studio, Northlight, works only with founders who have something real to say — then makes sure the world can''t look away.',
      'member'),
    (rohan, 'rohan-mehta', 'Rohan Mehta', 'Founder', 'Logistics', 'Delhi',
      'Getting fragile, high-value goods across India without a single scratch.',
      'Cut damage-in-transit to under 0.2% across 30 cities.',
      'After watching a shipment of lab equipment arrive in pieces, Rohan built CrateRoute around one obsession: things arrive exactly as they left. It turns out a lot of businesses will pay well for that certainty.',
      'member')
  on conflict (id) do nothing;

  -- businesses -------------------------------------------------------------
  insert into businesses (profile_id, name, description, founded_year, team_size, website) values
    (yashita, 'GreenWrap Industries', 'Compostable, export-grade packaging for FMCG brands that want to ship responsibly.', 2018, '40 people', 'greenwrap.in'),
    (arjun, 'LedgerLoop', 'Cash-flow-based lending for India''s small merchants — approvals in minutes.', 2020, '12 people', 'ledgerloop.com'),
    (priya, 'Northlight Studio', 'A brand studio for founder-led companies with a point of view.', 2017, '8 people', 'northlight.studio'),
    (rohan, 'CrateRoute', 'Specialised transport for fragile, high-value freight across India.', 2019, '60 people', 'crateroute.in')
  on conflict (profile_id) do nothing;

  -- expertise --------------------------------------------------------------
  insert into expertise (profile_id, label, sort_order) values
    (yashita, 'Manufacturing', 0), (yashita, 'Exports', 1), (yashita, 'B2B Sales', 2), (yashita, 'Sustainability', 3),
    (arjun, 'Fintech', 0), (arjun, 'Credit Risk', 1), (arjun, 'Product', 2), (arjun, 'Growth', 3),
    (priya, 'Branding', 0), (priya, 'Design', 1), (priya, 'Storytelling', 2), (priya, 'D2C', 3),
    (rohan, 'Logistics', 0), (rohan, 'Operations', 1), (rohan, 'Supply Chain', 2), (rohan, 'B2B', 3);

  -- offerings --------------------------------------------------------------
  insert into offerings (profile_id, title, description, sort_order) values
    (yashita, 'Compostable FMCG packaging', 'Retail-ready, certified compostable, at production scale.', 0),
    (yashita, 'Custom export-grade cartons', 'Engineered for long-haul freight and customs compliance.', 1),
    (arjun, 'Merchant working-capital lines', 'Revolving credit priced on live cash flow, not collateral.', 0),
    (arjun, 'Embedded lending API', 'Drop-in credit for marketplaces and POS platforms.', 1),
    (priya, 'Brand identity systems', 'Naming, voice, and visual language, end to end.', 0),
    (priya, 'Founder narrative', 'The story that makes a brand worth following.', 1),
    (rohan, 'White-glove freight', 'Climate-aware handling for sensitive cargo.', 0),
    (rohan, 'Damage-guarantee SLAs', 'Contractual damage caps backed by real tracking.', 1);

  -- work_items -------------------------------------------------------------
  insert into work_items (profile_id, kind, title, external_url, sort_order) values
    (yashita, 'brochure', 'Company brochure', '#', 0),
    (yashita, 'video', 'Factory tour', '#', 1),
    (yashita, 'case_study', 'Scaling to 3 continents', '#', 2),
    (arjun, 'case_study', '₹500 Cr, 12 people', '#', 0),
    (arjun, 'brochure', 'Partner deck', '#', 1),
    (priya, 'image', 'Selected work', '#', 0),
    (priya, 'case_study', 'Three category leaders', '#', 1),
    (rohan, 'video', 'Inside the network', '#', 0),
    (rohan, 'brochure', 'Service overview', '#', 1);

  -- member_open_to ---------------------------------------------------------
  insert into member_open_to (profile_id, option) values
    (yashita, 'partnerships'), (yashita, 'mentoring'), (yashita, 'speaking'),
    (arjun, 'partnerships'), (arjun, 'hiring'), (arjun, 'referrals'),
    (priya, 'mentoring'), (priya, 'speaking'), (priya, 'partnerships'),
    (rohan, 'partnerships'), (rohan, 'referrals');

  -- social_links -----------------------------------------------------------
  insert into social_links (profile_id, platform, url, sort_order) values
    (yashita, 'Website', 'https://greenwrap.in', 0), (yashita, 'LinkedIn', '#', 1), (yashita, 'Email', 'mailto:yashita@greenwrap.in', 2),
    (arjun, 'Website', 'https://ledgerloop.com', 0), (arjun, 'LinkedIn', '#', 1), (arjun, 'Email', 'mailto:arjun@ledgerloop.com', 2),
    (priya, 'Website', 'https://northlight.studio', 0), (priya, 'Instagram', '#', 1), (priya, 'Email', 'mailto:priya@northlight.studio', 2),
    (rohan, 'Website', 'https://crateroute.in', 0), (rohan, 'LinkedIn', '#', 1), (rohan, 'Email', 'mailto:rohan@crateroute.in', 2);
end $$;
