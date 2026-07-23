import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { isFieldVisible, type FieldVisibility } from "@/lib/profile-fields";
import {
  sampleMembers,
  toCover,
  type Member,
  type MemberAddress,
  type MemberCover,
  type WorkKind,
  type OpenToOption,
} from "@/lib/members";

// Server-side data access. Queries Supabase when configured; otherwise falls back
// to bundled sample data so local/offline dev keeps working. RLS enforces which
// rows the caller may read; per-field privacy is applied on top for non-owners.

// A configured project may still be unmigrated or unreachable (fresh env, no
// migrations applied yet). Treat that like "not configured" — fall back to the
// bundled sample data so builds and pages stay green until the schema is live.
function isSchemaMissing(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) return false;
  // PGRST205: table not in PostgREST schema cache · 42P01: undefined_table.
  return error.code === "PGRST205" || error.code === "42P01";
}

type AddressRow = {
  kind: string;
  line1: string | null;
  line2: string | null;
  line3: string | null;
  line4: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  map_link: string | null;
};

type ProfileRow = {
  id: string;
  slug: string;
  full_name: string;
  photo_url: string | null;
  company_logo_url: string | null;
  role_title: string | null;
  industry: string | null;
  city: string | null;
  positioning: string | null;
  known_for: string | null;
  about: string | null;
  cell_no: string | null;
  alt_no: string | null;
  whatsapp_link: string | null;
  whatsapp_dm_pref: string | null;
  work_email: string | null;
  personal_email: string | null;
  linkedin_url: string | null;
  business_instagram: string | null;
  personal_instagram: string | null;
  youtube_url: string | null;
  company_website: string | null;
  brand_names: string | null;
  usp: string | null;
  nature_of_business: string | null;
  category: string | null;
  best_time: string | null;
  best_modes: string[] | null;
  whatsapp_dm: boolean | null;
  birth_date: string | null;
  blood_group: string | null;
  marital_status: string | null;
  anniversary: string | null;
  areas_of_interest: string | null;
  network_groups: string | null;
  can_connect: string | null;
  want_connect: string | null;
  favourite_tools: string | null;
  purpose: string | null;
  contribution: string | null;
  interested_helping: string | null;
  interested_coaching: string | null;
  interested_networking: string | null;
  program_benefit_work: string | null;
  program_benefit_personal: string | null;
  cq_batch: string | null;
  ps_batch: string | null;
  bss_batch: string | null;
  conclaves_attended: number | null;
  field_visibility: FieldVisibility | null;
  businesses: {
    name: string | null;
    description: string | null;
    founded_year: number | null;
    team_size: string | null;
    website: string | null;
  } | null;
  expertise: { label: string; sort_order: number }[];
  offerings: { title: string; description: string | null; sort_order: number }[];
  work_items: {
    kind: WorkKind;
    title: string | null;
    external_url: string | null;
    file_path: string | null;
    sort_order: number;
  }[];
  member_open_to: { option: OpenToOption }[];
  social_links: { platform: string; url: string; sort_order: number }[];
  addresses: AddressRow[];
};

const PROFILE_SELECT = `
  id, slug, full_name, photo_url, company_logo_url, role_title, industry, city,
  positioning, known_for, about, cell_no, alt_no, work_email, personal_email,
  linkedin_url, business_instagram, personal_instagram, youtube_url, company_website,
  brand_names, usp, nature_of_business, category, best_time, best_modes, whatsapp_dm, whatsapp_dm_pref, whatsapp_link,
  birth_date, blood_group, marital_status, anniversary,
  areas_of_interest, network_groups, can_connect, want_connect, favourite_tools,
  purpose, contribution, interested_helping, interested_coaching, interested_networking,
  program_benefit_work, program_benefit_personal, cq_batch, ps_batch, bss_batch,
  conclaves_attended,
  field_visibility,
  businesses ( name, description, founded_year, team_size, website ),
  expertise ( label, sort_order ),
  offerings ( title, description, sort_order ),
  work_items ( kind, title, external_url, file_path, sort_order ),
  member_open_to ( option ),
  social_links ( platform, url, sort_order ),
  addresses ( kind, line1, line2, line3, line4, landmark, city, state, country, pincode, map_link )
`;

// Owners see everything; everyone else only fields not explicitly hidden.
function gate(vis: FieldVisibility, isOwner: boolean) {
  return (key: string) => isOwner || isFieldVisible(vis, key);
}

function toDisplayAddress(a: AddressRow | undefined): MemberAddress | null {
  if (!a) return null;
  const lines = [a.line1, a.line2, a.line3, a.line4, a.landmark]
    .map((l) => (l ?? "").trim())
    .filter(Boolean);
  const addr: MemberAddress = {
    lines,
    city: a.city ?? undefined,
    state: a.state ?? undefined,
    country: a.country ?? undefined,
    pincode: a.pincode ?? undefined,
    mapLink: a.map_link ?? undefined,
  };
  const hasContent =
    lines.length > 0 || addr.city || addr.state || addr.country || addr.pincode;
  return hasContent ? addr : null;
}

type Storage = NonNullable<Awaited<ReturnType<typeof createClient>>>["storage"];

// File-based attachments live in the private work-files bucket, so resolve a
// short-lived signed URL; link-based ones use their external URL directly.
async function resolveWorkHref(
  storage: Storage,
  w: ProfileRow["work_items"][number],
): Promise<string> {
  if (w.external_url) return w.external_url;
  if (w.file_path) {
    const { data } = await storage
      .from("work-files")
      .createSignedUrl(w.file_path, 60 * 60);
    return data?.signedUrl ?? "#";
  }
  return "#";
}

async function rowToMember(
  row: ProfileRow,
  isOwner: boolean,
  storage: Storage,
): Promise<Member> {
  const bySort = <T extends { sort_order: number }>(a: T, b: T) =>
    a.sort_order - b.sort_order;
  const vis = row.field_visibility ?? {};
  const show = gate(vis, isOwner);
  const addrByKind = new Map(row.addresses.map((a) => [a.kind, a]));

  // Presence links, assembled from profile columns and gated per field.
  const presence: { platform: string; url: string }[] = [];
  const pushLink = (
    key: string | null,
    platform: string,
    url: string | null,
    href?: (u: string) => string,
  ) => {
    const u = (url ?? "").trim();
    if (!u || (key && !show(key))) return;
    presence.push({ platform, url: href ? href(u) : u });
  };
  const withHttp = (u: string) => (/^https?:\/\//.test(u) ? u : `https://${u}`);
  pushLink(null, "Website", row.company_website, withHttp);
  pushLink("linkedin", "LinkedIn", row.linkedin_url, withHttp);
  pushLink("business_instagram", "Instagram", row.business_instagram, withHttp);
  pushLink("personal_instagram", "Instagram (personal)", row.personal_instagram, withHttp);
  pushLink(null, "YouTube", row.youtube_url, withHttp);
  pushLink("work_email", "Email", row.work_email, (u) => `mailto:${u}`);
  // Any manually-managed social_links rows still show, appended after.
  for (const p of [...row.social_links].sort(bySort)) {
    presence.push({ platform: p.platform, url: p.url });
  }

  const work = await Promise.all(
    [...row.work_items].sort(bySort).map(async (w) => ({
      kind: w.kind,
      title: w.title ?? "",
      href: await resolveWorkHref(storage, w),
    })),
  );

  const addr = (kind: string, key: string) =>
    show(key) ? toDisplayAddress(addrByKind.get(kind)) : null;

  return {
    id: row.id,
    slug: row.slug,
    fullName: row.full_name,
    photoUrl: row.photo_url,
    companyLogoUrl: row.company_logo_url,
    roleTitle: row.role_title ?? "",
    industry: row.industry ?? "",
    city: row.city ?? "",
    positioning: row.positioning ?? "",
    knownFor: row.known_for,
    about: row.about,
    expertise: [...row.expertise].sort(bySort).map((e) => e.label),
    business: row.businesses
      ? {
          name: row.businesses.name ?? "",
          description: row.businesses.description ?? undefined,
          foundedYear: row.businesses.founded_year ?? undefined,
          teamSize: row.businesses.team_size ?? undefined,
          website: row.businesses.website ?? undefined,
        }
      : null,
    offerings: [...row.offerings].sort(bySort).map((o) => ({
      title: o.title,
      description: o.description ?? undefined,
    })),
    work,
    openTo: row.member_open_to.map((o) => o.option),
    presence,
    contact: {
      cellNo: show("cell_no") ? row.cell_no : null,
      altNo: show("alt_no") ? row.alt_no : null,
      workEmail: show("work_email") ? row.work_email : null,
      personalEmail: show("personal_email") ? row.personal_email : null,
    },
    addresses: {
      work: addr("work", "work_address"),
      home: addr("home", "home_address"),
      factory: addr("factory", "factory_address"),
    },
    // Phase 4 — complete identity. Gated fields resolve to null when hidden.
    brandNames: row.brand_names ?? undefined,
    usp: row.usp ?? undefined,
    natureOfBusiness: row.nature_of_business ?? undefined,
    category: row.category ?? undefined,
    bestTime: row.best_time ?? undefined,
    bestModes: row.best_modes ?? undefined,
    whatsappDm: show("whatsapp") ? row.whatsapp_dm : null,
    whatsappDmPref: show("whatsapp")
      ? (["yes", "no", "dnd"].includes(row.whatsapp_dm_pref ?? "")
          ? (row.whatsapp_dm_pref as "yes" | "no" | "dnd")
          : row.whatsapp_dm
            ? "yes"
            : "no")
      : null,
    whatsapp: show("whatsapp") ? row.whatsapp_link : null,
    birthDate: show("birth_date") ? row.birth_date : null,
    bloodGroup: show("blood_group") ? (row.blood_group ?? undefined) : undefined,
    maritalStatus: show("marital_status") ? row.marital_status : null,
    anniversary: show("anniversary") ? row.anniversary : null,
    areasOfInterest: show("areas_of_interest") ? row.areas_of_interest : null,
    networkGroups: show("network_groups") ? row.network_groups : null,
    canConnect: show("can_connect") ? row.can_connect : null,
    wantConnect: show("want_connect") ? row.want_connect : null,
    favouriteTools: row.favourite_tools ?? undefined,
    purpose: row.purpose ?? undefined,
    contribution: show("contribution") ? row.contribution : null,
    interestedHelping: row.interested_helping ?? undefined,
    interestedCoaching: row.interested_coaching ?? undefined,
    interestedNetworking: row.interested_networking ?? undefined,
    programBenefitWork: row.program_benefit_work ?? undefined,
    programBenefitPersonal: row.program_benefit_personal ?? undefined,
    cqBatch: row.cq_batch ?? undefined,
    psBatch: row.ps_batch ?? undefined,
    bssBatch: row.bss_batch ?? undefined,
    conclavesAttended: row.conclaves_attended ?? null,
  };
}

// Wrapped in React cache() so the page body and generateMetadata share a single
// request-scoped fetch instead of hitting the DB twice per profile view.
export const getMember = cache(async (slug: string): Promise<Member | undefined> => {
  const supabase = await createClient();
  if (!supabase) return sampleMembers.find((m) => m.slug === slug);

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("slug", slug)
    .maybeSingle<ProfileRow>();

  if (error) {
    if (isSchemaMissing(error)) return sampleMembers.find((m) => m.slug === slug);
    throw error;
  }
  if (!data) return undefined;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === data.id;

  return rowToMember(data, isOwner, supabase.storage);
});

export async function getAllMembers(): Promise<MemberCover[]> {
  const supabase = await createClient();
  if (!supabase) {
    return sampleMembers
      .map(toCover)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `id, slug, full_name, photo_url, role_title, industry, city, positioning,
       category, areas_of_interest, created_at, businesses ( name ),
       member_open_to ( option )`,
    )
    .eq("status", "active")
    .order("full_name");

  if (error) {
    if (isSchemaMissing(error)) {
      return sampleMembers
        .map(toCover)
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    throw error;
  }
  return (data ?? []).map((r) => {
    const biz = Array.isArray(r.businesses) ? r.businesses[0] : r.businesses;
    const openTo = Array.isArray(r.member_open_to)
      ? (r.member_open_to as { option: OpenToOption }[]).map((o) => o.option)
      : [];
    return {
      id: r.id as string,
      slug: r.slug,
      fullName: r.full_name,
      photoUrl: r.photo_url,
      roleTitle: r.role_title ?? "",
      industry: r.industry ?? "",
      city: r.city ?? "",
      positioning: r.positioning ?? "",
      businessName: (biz as { name?: string } | null)?.name ?? "",
      category: r.category ?? "",
      interests: r.areas_of_interest ?? "",
      createdAt: (r.created_at as string) ?? "",
      openTo,
    };
  });
}

export async function getAllMemberSlugs(): Promise<string[]> {
  // Runs inside generateStaticParams (build time, no request) — must not touch
  // cookies(). Uses the cookieless anon client; RLS returns public slugs, and
  // any non-listed slug still renders on demand (dynamicParams defaults true).
  const supabase = createStaticClient();
  if (!supabase) return sampleMembers.map((m) => m.slug);

  const { data, error } = await supabase
    .from("profiles")
    .select("slug")
    .eq("status", "active");
  if (error) {
    if (isSchemaMissing(error)) return sampleMembers.map((m) => m.slug);
    throw error;
  }
  return (data ?? []).map((r) => r.slug as string);
}
