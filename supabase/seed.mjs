// Altus Tribe — production-quality seed (Sprint 1, Module 9).
//
// Populates a *migrated* live Supabase project with a realistic cohort so the
// frontend + integration tests have data to work against. Uses the service-role
// key's Admin API to create auth users (which fires handle_new_user → a `pending`
// profile), then enriches + activates them and fills every section/content table.
//
// The service-role key is NEVER stored in the repo. Supply it at run time:
//
//   # PowerShell
//   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."; node supabase/seed.mjs
//   # bash
//   SUPABASE_SERVICE_ROLE_KEY="eyJ..." node supabase/seed.mjs
//
// Idempotent: users are get-or-created by a stable email; 1:1 rows are upserted;
// 1:many content owned by seeded users is cleared then re-inserted. Safe to re-run.
//
// Ends with the 🔒 assertion from docs/13: a plain member, over an ANON client,
// must read ZERO rows from participant_admin (private CRM must never leak).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Config / env
// ---------------------------------------------------------------------------
const HERE = dirname(fileURLToPath(import.meta.url));

function parseEnvFile(path) {
  const out = {};
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local — rely on process.env */
  }
  return out;
}

const env = { ...parseEnvFile(join(HERE, "..", ".env.local")), ...process.env };
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = env.SEED_PASSWORD || "SeedPass!234";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "✗ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Set NEXT_PUBLIC_SUPABASE_URL " +
      "in .env.local and pass SUPABASE_SERVICE_ROLE_KEY in the environment.",
  );
  process.exit(1);
}

// Counts (override via env, e.g. SEED_MEMBERS=20 for a quick run).
const N_ADMINS = Number(env.SEED_ADMINS ?? 10);
const N_CONSULTANTS = Number(env.SEED_CONSULTANTS ?? 5);
const N_MEMBERS = Number(env.SEED_MEMBERS ?? 50);
const N_GROUPS = Number(env.SEED_GROUPS ?? 5);
const N_MESSAGES = Number(env.SEED_MESSAGES ?? 200);
const N_NOTIFICATIONS = Number(env.SEED_NOTIFICATIONS ?? 100);
const N_RESOURCES = Number(env.SEED_RESOURCES ?? 20);
const N_ANNOUNCEMENTS = Number(env.SEED_ANNOUNCEMENTS ?? 5);

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Deterministic pseudo-data
// ---------------------------------------------------------------------------
const FIRST = ["Yashita", "Arjun", "Manan", "Priya", "Rohan", "Aisha", "Vikram", "Neha", "Kabir", "Sara", "Dev", "Ira", "Aditya", "Meera", "Rahul", "Tara", "Karan", "Diya", "Nikhil", "Anaya"];
const LAST = ["Mouli", "Nair", "Shah", "Kapoor", "Reddy", "Iyer", "Bose", "Menon", "Gill", "Rao", "Sethi", "Verma", "Joshi", "Malhotra", "Chopra", "Bajaj", "Sinha", "Pillai", "Kaur", "Desai"];
const INDUSTRIES = ["Manufacturing", "Fintech", "Design", "Logistics", "Technology", "Healthcare", "Retail", "Services"];
const CATEGORIES = ["Products", "Services", "Solutions"];
const CITIES = ["Mumbai", "Bengaluru", "Delhi", "Pune", "Hyderabad", "Chennai", "Ahmedabad", "Jaipur"];
const STATES = ["Maharashtra", "Karnataka", "Delhi", "Maharashtra", "Telangana", "Tamil Nadu", "Gujarat", "Rajasthan"];
const ROLE_TITLES = ["Founder & CEO", "Managing Director", "Co-Founder", "Creative Director", "Head of Growth", "Principal Consultant"];
const RATINGS = ["ambassador", "mentor", "coach", "expert", "practitioner", "observer"];
const CONNECT_MODES = ["call", "whatsapp", "email", "dnd"];
const OPEN_TO = ["mentoring", "partnerships", "referrals", "speaking", "hiring"];

const pick = (arr, i) => arr[i % arr.length];
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// A person record built deterministically from an index + kind.
function person(kind, i) {
  const first = pick(FIRST, i);
  const last = pick(LAST, i * 3 + 1);
  const fullName = `${first} ${last}`;
  const cityIdx = i % CITIES.length;
  return {
    email: `seed+${kind}${String(i).padStart(2, "0")}@altustribe.test`,
    kind,
    first,
    last,
    fullName,
    industry: pick(INDUSTRIES, i),
    category: pick(CATEGORIES, i),
    city: CITIES[cityIdx],
    state: STATES[cityIdx],
    roleTitle: pick(ROLE_TITLES, i),
  };
}

// ---------------------------------------------------------------------------
// Users: get-or-create via the Admin API (idempotent)
// ---------------------------------------------------------------------------
async function listAllAuthUsers() {
  const byEmail = new Map();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) byEmail.set((u.email || "").toLowerCase(), u.id);
    if (data.users.length < 1000) break;
  }
  return byEmail;
}

async function getOrCreateUser(existing, p) {
  const hit = existing.get(p.email.toLowerCase());
  if (hit) return hit;
  const { data, error } = await admin.auth.admin.createUser({
    email: p.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: p.fullName },
  });
  if (error) throw new Error(`createUser ${p.email}: ${error.message}`);
  return data.user.id;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`→ Seeding ${SUPABASE_URL}`);

  const people = [
    ...Array.from({ length: N_ADMINS }, (_, i) => person("admin", i)),
    ...Array.from({ length: N_CONSULTANTS }, (_, i) => person("consultant", i)),
    ...Array.from({ length: N_MEMBERS }, (_, i) => person("member", i)),
  ];

  console.log(`→ Ensuring ${people.length} auth users…`);
  const existing = await listAllAuthUsers();
  for (const p of people) {
    p.id = await getOrCreateUser(existing, p);
  }
  const ids = people.map((p) => p.id);
  const admins = people.filter((p) => p.kind === "admin");
  const consultants = people.filter((p) => p.kind === "consultant");
  const members = people.filter((p) => p.kind === "member");

  // -- Clear previously-seeded content so re-runs stay clean (scoped to our ids).
  console.log("→ Clearing prior seeded content…");
  await admin.from("messages").delete().in("sender_id", ids);
  await admin.from("conversations").delete().in("created_by", ids); // cascades members+messages
  await admin.from("notifications").delete().in("recipient_id", ids);
  await admin.from("announcements").delete().in("author_id", ids);
  await admin.from("resources").delete().in("created_by", ids);
  await admin.from("spotlights").delete().in("profile_id", ids);
  for (const t of ["expertise", "offerings", "work_items", "social_links", "member_open_to", "addresses"]) {
    await admin.from(t).delete().in("profile_id", ids);
  }

  // -- profiles: enrich + activate + set roles (trigger left them pending) ----
  console.log("→ Enriching profiles…");
  for (const [i, p] of people.entries()) {
    const isMember = p.kind === "member";
    const { error } = await admin
      .from("profiles")
      .update({
        first_name: p.first,
        last_name: p.last,
        full_name: p.fullName,
        role_title: p.roleTitle,
        industry: p.industry,
        category: p.category,
        city: p.city,
        positioning: `Helping ${p.industry.toLowerCase()} teams do their best work.`,
        known_for: `${p.industry} · ${p.category}`,
        about: `${p.fullName} is a ${p.roleTitle} based in ${p.city}, working across ${p.industry}.`,
        cell_no: `98${String(1000000 + i * 137).slice(0, 8)}`,
        work_email: p.email,
        personal_email: p.email,
        company_website: `https://${p.first.toLowerCase()}-${p.last.toLowerCase()}.example.com`,
        nature_of_business: p.category,
        usp: `Trusted ${p.category.toLowerCase()} partner in ${p.city}.`,
        linkedin_url: `https://linkedin.com/in/${p.first.toLowerCase()}-${p.last.toLowerCase()}`,
        areas_of_interest: "Productivity, Community, Growth",
        cq_batch: `CQ-${2023 + (i % 3)}`,
        ps_batch: i % 2 === 0 ? `PS-${2024 + (i % 2)}` : null,
        best_modes: [pick(CONNECT_MODES, i), pick(CONNECT_MODES, i + 1)],
        whatsapp_dm: i % 2 === 0,
        // A couple of members get a non-default status to exercise gates.
        status: isMember && i % 17 === 0 ? "hidden" : "active",
        role: p.kind,
        visibility: "tribe",
        field_visibility: { cell_no: i % 3 !== 0, birth_date: false },
      })
      .eq("id", p.id);
    if (error) throw new Error(`profiles ${p.email}: ${error.message}`);
  }

  // -- businesses (1:1 upsert) -----------------------------------------------
  console.log("→ Businesses, addresses, expertise, offerings, work, socials…");
  await admin.from("businesses").upsert(
    people.map((p, i) => ({
      profile_id: p.id,
      name: `${p.last} ${pick(["Labs", "Studio", "Works", "& Co", "Ventures"], i)}`,
      description: `A ${p.industry} ${p.category.toLowerCase()} company.`,
      founded_year: 2010 + (i % 14),
      team_size: pick(["1-10", "11-50", "51-200", "200+"], i),
      website: `https://${p.first.toLowerCase()}-${p.last.toLowerCase()}.example.com`,
    })),
  );

  // -- addresses (work, one per member) --------------------------------------
  await admin.from("addresses").insert(
    people.map((p, i) => ({
      profile_id: p.id,
      kind: "work",
      line1: `${100 + i} ${pick(["MG Road", "Residency Rd", "Link Rd", "Ring Rd"], i)}`,
      line2: `Suite ${i + 1}`,
      landmark: "Near Metro",
      city: p.city,
      state: p.state,
      country: "India",
      pincode: String(400001 + i),
      map_link: "https://maps.example.com/x",
    })),
  );

  // -- expertise / offerings / work_items / social_links / open_to -----------
  const expertiseRows = [];
  const offeringRows = [];
  const workRows = [];
  const socialRows = [];
  const openToRows = [];
  for (const [i, p] of people.entries()) {
    for (let k = 0; k < 3; k++)
      expertiseRows.push({ profile_id: p.id, label: pick(["Strategy", "Ops", "Design", "Sales", "Product", "Finance"], i + k), sort_order: k });
    for (let k = 0; k < 2; k++)
      offeringRows.push({ profile_id: p.id, title: `${pick(["Consulting", "Workshop", "Audit", "Retainer"], i + k)}`, description: "Outcome-focused engagement.", sort_order: k });
    workRows.push({ profile_id: p.id, kind: "video", title: "Intro film", external_url: "https://youtu.be/dQw4w9WgXcQ", sort_order: 0 });
    workRows.push({ profile_id: p.id, kind: "brochure", title: "Company brochure", file_path: `work-files/${p.id}/brochure.pdf`, sort_order: 1 });
    socialRows.push({ profile_id: p.id, platform: "linkedin", url: `https://linkedin.com/in/${p.first.toLowerCase()}`, sort_order: 0 });
    openToRows.push({ profile_id: p.id, option: pick(OPEN_TO, i) });
    openToRows.push({ profile_id: p.id, option: pick(OPEN_TO, i + 2) });
  }
  await admin.from("expertise").insert(expertiseRows);
  await admin.from("offerings").insert(offeringRows);
  await admin.from("work_items").insert(workRows);
  await admin.from("social_links").insert(socialRows);
  // dedupe open_to (pk profile_id+option)
  const seenOpen = new Set();
  await admin.from("member_open_to").insert(
    openToRows.filter((r) => {
      const key = `${r.profile_id}:${r.option}`;
      if (seenOpen.has(key)) return false;
      seenOpen.add(key);
      return true;
    }),
  );

  // -- taxonomies (extend the migration's starter set) -----------------------
  await admin.from("taxonomies").upsert(
    [
      ...CITIES.map((v, i) => ({ kind: "city", value: v, sort_order: i })),
      ...STATES.map((v, i) => ({ kind: "state", value: v, sort_order: i })),
      { kind: "country", value: "India", sort_order: 0 },
    ],
    { onConflict: "kind,value" },
  );

  // -- private CRM: participant_admin for members, consultant-assigned --------
  console.log("→ Private CRM (participant_admin) + consultant assignments…");
  await admin.from("participant_admin").upsert(
    members.map((p, i) => ({
      profile_id: p.id,
      referred_by: pick(FIRST, i + 5),
      breakthrough: "Doubled referral output in Q2.",
      designated_consultant: consultants.length ? consultants[i % consultants.length].id : null,
      rating: pick(RATINGS, i),
      upsell_possible: i % 3 === 0,
      impact: { revenue_influenced: 100000 + i * 5000, sessions: 3 + (i % 5) },
    })),
  );

  // -- announcements + resources + spotlights --------------------------------
  console.log("→ Announcements, resources, spotlights…");
  await admin.from("announcements").insert(
    Array.from({ length: N_ANNOUNCEMENTS }, (_, i) => ({
      title: `Tribe Update #${i + 1}`,
      body: "Monthly highlights, new members, and upcoming conclaves.",
      author_id: admins[i % admins.length].id,
      published_at: new Date(Date.now() - i * 864e5).toISOString(),
    })),
  );
  await admin.from("resources").insert(
    Array.from({ length: N_RESOURCES }, (_, i) => ({
      kind: pick(["video", "inspiration", "brochure"], i),
      title: `${pick(["Deep Work", "Founder Story", "Playbook", "Masterclass"], i)} ${i + 1}`,
      description: "Curated for the tribe.",
      external_url: i % 3 === 0 ? "https://youtu.be/dQw4w9WgXcQ" : null,
      file_path: i % 3 === 2 ? `resources/asset-${i}.pdf` : null,
      created_by: admins[i % admins.length].id,
    })),
  );
  await admin.from("spotlights").insert(
    members.slice(0, 6).map((p, i) => ({
      profile_id: p.id,
      title: `Spotlight: ${p.fullName}`,
      body: `How ${p.first} scaled their ${p.industry} practice.`,
      published_at: new Date(Date.now() - i * 2 * 864e5).toISOString(),
    })),
  );

  // -- conversations (direct + group) + members + messages -------------------
  console.log(`→ Conversations + ${N_MESSAGES} messages…`);
  const active = people.filter((_, i) => i % 17 !== 0); // skip the hidden ones
  const conversations = [];

  // direct: pair up consecutive active members
  for (let i = 0; i + 1 < active.length && conversations.length < 15; i += 2) {
    conversations.push({ kind: "direct", members: [active[i], active[i + 1]] });
  }
  // groups
  for (let g = 0; g < N_GROUPS; g++) {
    const grp = active.slice(g * 4, g * 4 + 4);
    if (grp.length >= 2) conversations.push({ kind: "group", title: `Circle ${g + 1}`, members: grp });
  }

  const messagesToInsert = [];
  for (const c of conversations) {
    const { data: conv, error } = await admin
      .from("conversations")
      .insert({ kind: c.kind, title: c.title ?? null, created_by: c.members[0].id })
      .select("id")
      .single();
    if (error) throw new Error(`conversation: ${error.message}`);
    c.id = conv.id;
    await admin.from("conversation_members").insert(
      c.members.map((m, idx) => ({
        conversation_id: c.id,
        profile_id: m.id,
        role: idx === 0 ? "owner" : "member",
      })),
    );
  }
  // distribute messages round-robin across conversations
  for (let m = 0; m < N_MESSAGES; m++) {
    const c = conversations[m % conversations.length];
    if (!c) break;
    const sender = c.members[m % c.members.length];
    messagesToInsert.push({
      conversation_id: c.id,
      sender_id: sender.id,
      body: pick(["Hey! Great connecting.", "Can we set up a call?", "Shared the deck 📎", "Loved your talk.", "Let's collaborate."], m),
      created_at: new Date(Date.now() - (N_MESSAGES - m) * 6e5).toISOString(),
    });
  }
  for (const batch of chunk(messagesToInsert, 500)) {
    const { error } = await admin.from("messages").insert(batch);
    if (error) throw new Error(`messages: ${error.message}`);
  }

  // -- notifications ----------------------------------------------------------
  console.log(`→ ${N_NOTIFICATIONS} notifications + prefs…`);
  const notifs = Array.from({ length: N_NOTIFICATIONS }, (_, i) => {
    const r = active[i % active.length];
    return {
      recipient_id: r.id,
      kind: pick(["message", "announcement", "mention", "system"], i),
      title: pick(["New message", "New announcement", "You were mentioned", "Welcome to the tribe"], i),
      body: "Tap to view.",
      link: i % 2 === 0 ? "/messages" : "/notifications",
      read_at: i % 3 === 0 ? new Date().toISOString() : null,
    };
  });
  for (const batch of chunk(notifs, 500)) await admin.from("notifications").insert(batch);
  await admin.from("notification_prefs").upsert(
    people.map((p, i) => ({
      profile_id: p.id,
      announcements: true,
      messages: true,
      mentions: i % 2 === 0,
      monthly_digest: i % 4 === 0,
    })),
  );

  // -- summary ----------------------------------------------------------------
  console.log("\n✓ Seed complete:");
  console.log(`   users: ${people.length} (admins ${admins.length}, consultants ${consultants.length}, members ${members.length})`);
  console.log(`   conversations: ${conversations.length}, messages: ${messagesToInsert.length}, notifications: ${notifs.length}`);
  console.log(`   resources: ${N_RESOURCES}, announcements: ${N_ANNOUNCEMENTS}`);

  await verifyCrmIsolation(members[0]);
}

// 🔒 The one assertion that must pass (docs/13): a plain member, over an ANON
// client (real RLS, not service-role bypass), must read ZERO CRM rows.
async function verifyCrmIsolation(member) {
  if (!ANON_KEY) {
    console.log("\n⚠ Skipping CRM isolation check — no anon key in env.");
    return;
  }
  console.log("\n🔒 Verifying CRM isolation as a plain member…");
  const asMember = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInErr } = await asMember.auth.signInWithPassword({
    email: member.email,
    password: PASSWORD,
  });
  if (signInErr) {
    console.log(`   ⚠ Could not sign in as member (${signInErr.message}); check manually.`);
    return;
  }
  const { data, error } = await asMember.from("participant_admin").select("*");
  const leaked = (data ?? []).length;
  if (error) {
    console.log(`   ✓ participant_admin blocked (${error.code ?? error.message}). No leak.`);
  } else if (leaked === 0) {
    console.log("   ✓ participant_admin returned 0 rows to a member. CRM is isolated.");
  } else {
    console.error(`   ✗✗ LEAK: member read ${leaked} CRM rows. FIX RLS BEFORE LAUNCH.`);
    process.exitCode = 2;
  }
  await asMember.auth.signOut();
}

main().catch((e) => {
  console.error("\n✗ Seed failed:", e.message);
  process.exit(1);
});
