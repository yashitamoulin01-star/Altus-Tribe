import "server-only";
import { getUser as getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Campus data layer (Phase 5.3). Learning resources + per-member bookmark/
// completion state. Offline-first: bundled samples when unconfigured/unmigrated.

export type CampusKind = "video" | "brochure" | "inspiration";

export interface CampusResource {
  id: string;
  kind: CampusKind;
  title: string;
  description: string | null;
  externalUrl: string | null; // video / link
  filePath: string | null; // storage path (brochure) — signed on the detail page
  thumbnailUrl: string | null;
  bookmarked: boolean;
  completed: boolean;
}

export const CAMPUS_CATEGORIES: { kind: CampusKind; label: string }[] = [
  { kind: "video", label: "Video Library" },
  { kind: "brochure", label: "Playbooks & Resources" },
  { kind: "inspiration", label: "Inspiration" },
];

const schemaMissing = (e: { code?: string } | null) =>
  e?.code === "PGRST205" || e?.code === "42P01";

const SAMPLE: CampusResource[] = [
  { id: "v1", kind: "video", title: "The Productivity Operating System", description: "Manan on building a system that runs without you.", externalUrl: "https://youtu.be/dQw4w9WgXcQ", filePath: null, thumbnailUrl: null, bookmarked: false, completed: false },
  { id: "v2", kind: "video", title: "Delegation without drop-off", description: "Getting work done through others — the right way.", externalUrl: "https://youtu.be/dQw4w9WgXcQ", filePath: null, thumbnailUrl: null, bookmarked: false, completed: false },
  { id: "v3", kind: "video", title: "The weekly review that compounds", description: "A 30-minute ritual that protects your month.", externalUrl: "https://youtu.be/dQw4w9WgXcQ", filePath: null, thumbnailUrl: null, bookmarked: false, completed: false },
  { id: "i1", kind: "inspiration", title: "From 40 to 400 in eighteen months", description: "How one member scaled without losing the plot.", externalUrl: "#", filePath: null, thumbnailUrl: null, bookmarked: false, completed: false },
  { id: "i2", kind: "inspiration", title: "The founder who fired herself", description: "Stepping out of the day-to-day to build the business.", externalUrl: "#", filePath: null, thumbnailUrl: null, bookmarked: false, completed: false },
  { id: "p1", kind: "brochure", title: "The KPI one-pager", description: "The single sheet that keeps a team honest.", externalUrl: null, filePath: "resources/kpi.pdf", thumbnailUrl: null, bookmarked: false, completed: false },
  { id: "p2", kind: "brochure", title: "Meeting-free mornings, a template", description: "Protect your maker time by default.", externalUrl: null, filePath: "resources/mornings.pdf", thumbnailUrl: null, bookmarked: false, completed: false },
];

// Fetch the current member's activity (bookmark/completed) as a map.
async function activityMap(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
): Promise<Map<string, { bookmarked: boolean; completed: boolean }>> {
  const out = new Map<string, { bookmarked: boolean; completed: boolean }>();
  const { data } = await supabase
    .from("resource_activity")
    .select("resource_id, bookmarked, completed")
    .eq("profile_id", userId);
  for (const a of data ?? [])
    out.set(a.resource_id as string, {
      bookmarked: Boolean(a.bookmarked),
      completed: Boolean(a.completed),
    });
  return out;
}

export async function getCampusResources(): Promise<CampusResource[]> {
  const supabase = await createClient();
  if (!supabase) return SAMPLE;

  const { data, error } = await supabase
    .from("resources")
    .select("id, kind, title, description, external_url, file_path, thumbnail_url")
    .in("kind", ["video", "brochure", "inspiration"])
    .order("created_at", { ascending: false });
  if (error) {
    if (schemaMissing(error)) return SAMPLE;
    return [];
  }

  const user = await getSessionUser();
  const activity = user ? await activityMap(supabase, user.id) : new Map();

  return (data ?? []).map((r) => {
    const a = activity.get(r.id as string);
    return {
      id: r.id as string,
      kind: r.kind as CampusKind,
      title: r.title as string,
      description: (r.description as string) ?? null,
      externalUrl: (r.external_url as string) ?? null,
      filePath: (r.file_path as string) ?? null,
      thumbnailUrl: (r.thumbnail_url as string) ?? null,
      bookmarked: a?.bookmarked ?? false,
      completed: a?.completed ?? false,
    };
  });
}

// Single resource for the detail/player page, with a signed URL for file-backed
// resources (the `resources` bucket is private).
export async function getCampusResource(
  id: string,
): Promise<(CampusResource & { fileUrl: string | null }) | null> {
  const supabase = await createClient();
  if (!supabase) {
    const s = SAMPLE.find((r) => r.id === id);
    return s ? { ...s, fileUrl: null } : null;
  }

  const { data, error } = await supabase
    .from("resources")
    .select("id, kind, title, description, external_url, file_path, thumbnail_url")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (schemaMissing(error)) {
      const s = SAMPLE.find((r) => r.id === id);
      return s ? { ...s, fileUrl: null } : null;
    }
    return null;
  }
  if (!data) return null;

  const user = await getSessionUser();
  const activity = user ? await activityMap(supabase, user.id) : new Map();
  const a = activity.get(data.id as string);

  let fileUrl: string | null = null;
  if (data.file_path) {
    const { data: signed } = await supabase.storage
      .from("resources")
      .createSignedUrl(data.file_path as string, 60 * 60);
    fileUrl = signed?.signedUrl ?? null;
  }

  return {
    id: data.id as string,
    kind: data.kind as CampusKind,
    title: data.title as string,
    description: (data.description as string) ?? null,
    externalUrl: (data.external_url as string) ?? null,
    filePath: (data.file_path as string) ?? null,
    thumbnailUrl: (data.thumbnail_url as string) ?? null,
    bookmarked: a?.bookmarked ?? false,
    completed: a?.completed ?? false,
    fileUrl,
  };
}
