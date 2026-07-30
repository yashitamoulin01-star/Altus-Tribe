import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

// Member connections (Phase 5, Tribe). A directed request that becomes mutual on
// accept. All reads are scoped to the signed-in user; RLS is the real boundary.
// Offline/unmigrated → empty results so the UI degrades cleanly.

// How the current user relates to another member.
export type ConnectionState =
  | "none" // no row
  | "outgoing" // I requested them, pending
  | "incoming" // they requested me, pending
  | "connected" // accepted
  | "self";

export interface ConnectionPerson {
  id: string;
  slug: string;
  fullName: string;
  photoUrl: string | null;
  roleTitle: string;
  industry: string;
  createdAt: string; // request/connection timestamp
}

const schemaMissing = (e: { code?: string } | null) =>
  e?.code === "PGRST205" || e?.code === "42P01";

// Hydrate a set of profile ids into display people.
async function hydrate(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  ids: string[],
): Promise<Map<string, Omit<ConnectionPerson, "createdAt">>> {
  const out = new Map<string, Omit<ConnectionPerson, "createdAt">>();
  if (!ids.length) return out;
  const { data } = await supabase
    .from("profiles")
    .select("id, slug, full_name, photo_url, role_title, industry")
    .in("id", ids);
  for (const p of data ?? []) {
    out.set(p.id as string, {
      id: p.id as string,
      slug: (p.slug as string) ?? "",
      fullName: (p.full_name as string) ?? "",
      photoUrl: (p.photo_url as string) ?? null,
      roleTitle: (p.role_title as string) ?? "",
      industry: (p.industry as string) ?? "",
    });
  }
  return out;
}

// Map of otherProfileId → state, across all of the caller's connection rows.
// One query powers connection buttons across a whole directory page.
export async function getConnectionMap(): Promise<Map<string, ConnectionState>> {
  const map = new Map<string, ConnectionState>();
  const supabase = await createClient();
  if (!supabase) return map;
  const user = await getUser();
  if (!user) return map;

  const { data, error } = await supabase
    .from("connections")
    .select("requester_id, addressee_id, status")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
  if (error || !data) return map;

  for (const r of data) {
    const iAmRequester = r.requester_id === user.id;
    const other = (iAmRequester ? r.addressee_id : r.requester_id) as string;
    const state: ConnectionState =
      r.status === "accepted"
        ? "connected"
        : r.status === "pending"
          ? iAmRequester
            ? "outgoing"
            : "incoming"
          : "none";
    map.set(other, state);
  }
  return map;
}

export async function getConnectionState(otherId: string): Promise<ConnectionState> {
  const supabase = await createClient();
  if (!supabase) return "none";
  const user = await getUser();
  if (!user) return "none";
  if (user.id === otherId) return "self";
  const map = await getConnectionMap();
  return map.get(otherId) ?? "none";
}

// Pending requests addressed to me (the inbox).
export async function getIncomingRequests(): Promise<ConnectionPerson[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const user = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("connections")
    .select("requester_id, created_at")
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) {
    if (schemaMissing(error)) return [];
    throw error;
  }
  const people = await hydrate(supabase, (data ?? []).map((r) => r.requester_id as string));
  return (data ?? [])
    .map((r) => {
      const p = people.get(r.requester_id as string);
      return p ? { ...p, createdAt: r.created_at as string } : null;
    })
    .filter((x): x is ConnectionPerson => x !== null);
}

// My accepted connections.
export async function getConnections(): Promise<ConnectionPerson[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const user = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("connections")
    .select("requester_id, addressee_id, updated_at")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted")
    .order("updated_at", { ascending: false });
  if (error) {
    if (schemaMissing(error)) return [];
    throw error;
  }
  const rows = data ?? [];
  const otherIds = rows.map((r) =>
    (r.requester_id === user.id ? r.addressee_id : r.requester_id) as string,
  );
  const people = await hydrate(supabase, otherIds);
  return rows
    .map((r) => {
      const other = (r.requester_id === user.id ? r.addressee_id : r.requester_id) as string;
      const p = people.get(other);
      return p ? { ...p, createdAt: r.updated_at as string } : null;
    })
    .filter((x): x is ConnectionPerson => x !== null);
}

export async function getIncomingRequestCount(): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;
  const user = await getUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("addressee_id", user.id)
    .eq("status", "pending");
  if (error) return 0;
  return count ?? 0;
}
