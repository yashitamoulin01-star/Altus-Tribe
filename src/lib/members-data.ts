import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  sampleMembers,
  toCover,
  type Member,
  type MemberCover,
  type WorkKind,
  type OpenToOption,
} from "@/lib/members";

// Server-side data access. Queries Supabase when configured; otherwise falls back
// to bundled sample data so local/offline dev keeps working. RLS enforces which
// rows the caller may read; per-field privacy is applied on top for non-owners.

type ProfileRow = {
  id: string;
  slug: string;
  full_name: string;
  photo_url: string | null;
  role_title: string | null;
  industry: string | null;
  city: string | null;
  positioning: string | null;
  known_for: string | null;
  about: string | null;
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
    sort_order: number;
  }[];
  member_open_to: { option: OpenToOption }[];
  social_links: { platform: string; url: string; sort_order: number }[];
};

const PROFILE_SELECT = `
  id, slug, full_name, photo_url, role_title, industry, city, positioning, known_for, about,
  businesses ( name, description, founded_year, team_size, website ),
  expertise ( label, sort_order ),
  offerings ( title, description, sort_order ),
  work_items ( kind, title, external_url, sort_order ),
  member_open_to ( option ),
  social_links ( platform, url, sort_order )
`;

function rowToMember(row: ProfileRow): Member {
  const bySort = <T extends { sort_order: number }>(a: T, b: T) =>
    a.sort_order - b.sort_order;

  return {
    slug: row.slug,
    fullName: row.full_name,
    photoUrl: row.photo_url,
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
    work: [...row.work_items].sort(bySort).map((w) => ({
      kind: w.kind,
      title: w.title ?? "",
      href: w.external_url ?? "#",
    })),
    openTo: row.member_open_to.map((o) => o.option),
    presence: [...row.social_links].sort(bySort).map((p) => ({
      platform: p.platform,
      url: p.url,
    })),
  };
}

export async function getMember(slug: string): Promise<Member | undefined> {
  const supabase = await createClient();
  if (!supabase) return sampleMembers.find((m) => m.slug === slug);

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("slug", slug)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  return data ? rowToMember(data) : undefined;
}

export async function getAllMembers(): Promise<MemberCover[]> {
  const supabase = await createClient();
  if (!supabase) {
    return sampleMembers
      .map(toCover)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("slug, full_name, photo_url, role_title, industry, city, positioning")
    .eq("status", "active")
    .order("full_name");

  if (error) throw error;
  return (data ?? []).map((r) => ({
    slug: r.slug,
    fullName: r.full_name,
    photoUrl: r.photo_url,
    roleTitle: r.role_title ?? "",
    industry: r.industry ?? "",
    city: r.city ?? "",
    positioning: r.positioning ?? "",
  }));
}

export async function getAllMemberSlugs(): Promise<string[]> {
  const supabase = await createClient();
  if (!supabase) return sampleMembers.map((m) => m.slug);

  const { data, error } = await supabase.from("profiles").select("slug");
  if (error) throw error;
  return (data ?? []).map((r) => r.slug as string);
}
