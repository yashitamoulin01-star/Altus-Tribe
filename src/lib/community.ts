import "server-only";
import { createClient } from "@/lib/supabase/server";

// Content for the Campus + Sacred Space worlds. Queries Supabase when available,
// falling back to bundled sample content when unconfigured or unmigrated — the
// same offline-first pattern the rest of the app uses.

export interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt: string | null;
}

export interface Resource {
  id: string;
  kind: "video" | "brochure" | "inspiration" | "announcement";
  title: string;
  description: string | null;
  url: string | null;
}

const schemaMissing = (e: { code?: string } | null) =>
  e?.code === "PGRST205" || e?.code === "42P01";

// --- Sample fallbacks ------------------------------------------------------

const SAMPLE_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "s1",
    title: "The next Conclave is open for registration",
    body: "Doors open for the winter Conclave. Members get priority seating — reply in your cohort group to claim a seat.",
    publishedAt: "2026-07-14",
  },
  {
    id: "s2",
    title: "A note on how we show up here",
    body: "This is an invited room. Be generous, be specific, and make introductions freely. The Tribe compounds when we do.",
    publishedAt: "2026-07-02",
  },
];

const SAMPLE_VIDEOS: Resource[] = [
  { id: "v1", kind: "video", title: "The Productivity Operating System", description: "Manan on building a system that runs without you.", url: "#" },
  { id: "v2", kind: "video", title: "Delegation without drop-off", description: "Getting work done through others — the right way.", url: "#" },
  { id: "v3", kind: "video", title: "The weekly review that compounds", description: "A 30-minute ritual that protects your month.", url: "#" },
];

const SAMPLE_INSPIRATION: Resource[] = [
  { id: "i1", kind: "inspiration", title: "From 40 to 400 in eighteen months", description: "How one member scaled without losing the plot.", url: "#" },
  { id: "i2", kind: "inspiration", title: "The founder who fired herself", description: "Stepping out of the day-to-day to build the business.", url: "#" },
];

const SAMPLE_PRODUCTIVITY: Resource[] = [
  { id: "p1", kind: "brochure", title: "The KPI one-pager", description: "The single sheet that keeps a team honest.", url: "#" },
  { id: "p2", kind: "brochure", title: "Meeting-free mornings, a template", description: "Protect your maker time by default.", url: "#" },
];

export async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient();
  if (!supabase) return SAMPLE_ANNOUNCEMENTS;

  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error) {
    if (schemaMissing(error)) return SAMPLE_ANNOUNCEMENTS;
    throw error;
  }
  if (!data || data.length === 0) return SAMPLE_ANNOUNCEMENTS;
  return data.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    body: (r.body as string) ?? "",
    publishedAt: (r.published_at as string) ?? null,
  }));
}

export async function getResources(
  kind: Resource["kind"],
): Promise<Resource[]> {
  const fallback =
    kind === "video"
      ? SAMPLE_VIDEOS
      : kind === "inspiration"
        ? SAMPLE_INSPIRATION
        : SAMPLE_PRODUCTIVITY;

  const supabase = await createClient();
  if (!supabase) return fallback;

  const { data, error } = await supabase
    .from("resources")
    .select("id, kind, title, description, external_url")
    .eq("kind", kind)
    .order("created_at", { ascending: false });

  if (error) {
    if (schemaMissing(error)) return fallback;
    throw error;
  }
  if (!data || data.length === 0) return fallback;
  return data.map((r) => ({
    id: r.id as string,
    kind: r.kind as Resource["kind"],
    title: r.title as string,
    description: (r.description as string) ?? null,
    url: (r.external_url as string) ?? null,
  }));
}
