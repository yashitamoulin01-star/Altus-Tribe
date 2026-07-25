import "server-only";
import { createClient } from "@/lib/supabase/server";

// Admin content data layer (Phase 5.5): announcements + resources management and
// light analytics. Admin-gated by RLS; offline returns representative samples.

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string | null;
  published: boolean;
  publishedAt: string | null;
  pinned: boolean;
  createdAt: string;
}

export interface AdminResource {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  externalUrl: string | null;
  filePath: string | null;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actorName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Analytics {
  members: number;
  active: number;
  pending: number;
  hiddenInactive: number;
  admins: number;
  consultants: number;
  conversations: number;
  messages: number;
  connections: number;
  announcements: number;
  resources: number;
}

export interface AdminTaxonomy {
  id: string;
  kind: string;
  value: string;
  sortOrder: number;
}

// The dropdown kinds an admin curates (docs/17 §6). Order = display order.
export const TAXONOMY_KINDS = ["industry", "category", "city", "state", "country"] as const;
export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

const schemaMissing = (e: { code?: string } | null) =>
  e?.code === "PGRST205" || e?.code === "42P01";

const SAMPLE_TAXONOMIES: AdminTaxonomy[] = [
  { id: "t-1", kind: "industry", value: "Manufacturing", sortOrder: 0 },
  { id: "t-2", kind: "industry", value: "Fintech", sortOrder: 1 },
  { id: "t-3", kind: "industry", value: "Design", sortOrder: 2 },
  { id: "t-4", kind: "category", value: "Products", sortOrder: 0 },
  { id: "t-5", kind: "category", value: "Services", sortOrder: 1 },
  { id: "t-6", kind: "category", value: "Solutions", sortOrder: 2 },
];

// All curated dropdown values, grouped by kind, for the admin Categories screen.
export async function getAllTaxonomies(): Promise<AdminTaxonomy[]> {
  const supabase = await createClient();
  if (!supabase) return SAMPLE_TAXONOMIES;
  const { data, error } = await supabase
    .from("taxonomies")
    .select("id, kind, value, sort_order")
    .order("kind")
    .order("sort_order");
  if (error) {
    if (schemaMissing(error)) return SAMPLE_TAXONOMIES;
    return [];
  }
  return (data ?? []).map((t) => ({
    id: t.id as string,
    kind: t.kind as string,
    value: t.value as string,
    sortOrder: (t.sort_order as number) ?? 0,
  }));
}

export async function getAdminAnnouncements(): Promise<AdminAnnouncement[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, published_at, pinned_at, created_at")
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) {
    if (schemaMissing(error)) return [];
    return [];
  }
  return (data ?? []).map((a) => ({
    id: a.id as string,
    title: a.title as string,
    body: (a.body as string) ?? null,
    published: Boolean(a.published_at),
    publishedAt: (a.published_at as string) ?? null,
    pinned: Boolean(a.pinned_at),
    createdAt: a.created_at as string,
  }));
}

export async function getAdminResources(): Promise<AdminResource[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("resources")
    .select("id, kind, title, description, external_url, file_path, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    if (schemaMissing(error)) return [];
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    kind: r.kind as string,
    title: r.title as string,
    description: (r.description as string) ?? null,
    externalUrl: (r.external_url as string) ?? null,
    filePath: (r.file_path as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

export async function getAuditLog(limit = 100): Promise<AuditEntry[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, metadata, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((r) => {
    const actor = r.actor as { full_name?: string } | { full_name?: string }[] | null;
    const actorName = Array.isArray(actor) ? actor[0]?.full_name ?? null : actor?.full_name ?? null;
    return {
      id: r.id as string,
      actorName,
      action: r.action as string,
      entityType: (r.entity_type as string) ?? null,
      entityId: (r.entity_id as string) ?? null,
      metadata: (r.metadata as Record<string, unknown>) ?? {},
      createdAt: r.created_at as string,
    };
  });
}

const SAMPLE_ANALYTICS: Analytics = {
  members: 65, active: 58, pending: 3, hiddenInactive: 4, admins: 10, consultants: 5,
  conversations: 20, messages: 200, connections: 42, announcements: 5, resources: 20,
};

export async function getAnalytics(): Promise<Analytics> {
  const supabase = await createClient();
  if (!supabase) return SAMPLE_ANALYTICS;

  // Head-only count of a table, optionally filtered by one equality.
  const count = async (
    table: string,
    col?: string,
    val?: string,
  ): Promise<number> => {
    const base = supabase.from(table).select("id", { count: "exact", head: true });
    const { count: c, error } = await (col && val ? base.eq(col, val) : base);
    return error ? 0 : c ?? 0;
  };

  const [
    members, active, pending, hidden, inactive, admins, consultants,
    conversations, messages, connections, announcements, resources,
  ] = await Promise.all([
    count("profiles"),
    count("profiles", "status", "active"),
    count("profiles", "status", "pending"),
    count("profiles", "status", "hidden"),
    count("profiles", "status", "inactive"),
    count("profiles", "role", "admin"),
    count("profiles", "role", "consultant"),
    count("conversations"),
    count("messages"),
    count("connections", "status", "accepted"),
    count("announcements"),
    count("resources"),
  ]);

  // Unmigrated project → the counts all come back 0; show the sample instead.
  if (members === 0 && conversations === 0 && resources === 0) return SAMPLE_ANALYTICS;

  return {
    members, active, pending, hiddenInactive: hidden + inactive, admins, consultants,
    conversations, messages, connections, announcements, resources,
  };
}

export interface TrendPoint {
  label: string; // "Feb"
  value: number;
}

const SAMPLE_TREND: TrendPoint[] = [
  { label: "Feb", value: 4 }, { label: "Mar", value: 9 }, { label: "Apr", value: 7 },
  { label: "May", value: 12 }, { label: "Jun", value: 15 }, { label: "Jul", value: 18 },
];

// Participants who joined per month over the last 6 months (for the trend chart).
export async function getSignupTrend(): Promise<TrendPoint[]> {
  const supabase = await createClient();
  if (!supabase) return SAMPLE_TREND;

  const start = new Date();
  start.setMonth(start.getMonth() - 5, 1);
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", start.toISOString());
  if (error || !data) return SAMPLE_TREND;

  // Seed the last 6 month buckets so gaps show as 0.
  const buckets = new Map<string, number>();
  const order: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets.set(key, 0);
    order.push(key);
  }
  for (const r of data) {
    const d = new Date(r.created_at as string);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return order.map((key) => {
    const m = Number(key.split("-")[1]);
    return { label: months[m], value: buckets.get(key) ?? 0 };
  });
}
