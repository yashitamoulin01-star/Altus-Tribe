import "server-only";
import { createClient } from "@/lib/supabase/server";

// Admin data layer (docs/12-spec-admin-crm.md). Role-gated roster + mutations.
// Offline/unconfigured Supabase → a labelled preview with sample data, matching
// the rest of the app's offline-first pattern. In configured mode, RLS is the
// real boundary; this layer adds the UI-level gate and convenience reads.

export type Role = "member" | "consultant" | "admin";
export type MemberStatus = "active" | "hidden" | "inactive" | "pending";

export interface AdminContext {
  configured: boolean;
  role: Role | null;
  canAccess: boolean; // admin or consultant
  isAdmin: boolean; // role === admin
  userId: string | null;
}

export interface RosterMember {
  id: string;
  slug: string;
  fullName: string;
  photoUrl: string | null;
  role: Role;
  status: MemberStatus;
  city: string | null;
  industry: string | null;
  cqBatch: string | null;
  psBatch: string | null;
}

const schemaMissing = (e: { code?: string } | null) =>
  e?.code === "PGRST205" || e?.code === "42P01";

const SAMPLE_ROSTER: RosterMember[] = [
  { id: "s-yashita", slug: "yashita-mouli", fullName: "Yashita Mouli", photoUrl: null, role: "member", status: "active", city: "Mumbai", industry: "Manufacturing", cqBatch: "CQ-07", psBatch: "PS-12" },
  { id: "s-arjun", slug: "arjun-nair", fullName: "Arjun Nair", photoUrl: null, role: "consultant", status: "active", city: "Bengaluru", industry: "Fintech", cqBatch: "CQ-05", psBatch: "PS-09" },
  { id: "s-priya", slug: "priya-deshmukh", fullName: "Priya Deshmukh", photoUrl: null, role: "member", status: "active", city: "Pune", industry: "Design", cqBatch: "CQ-06", psBatch: "PS-11" },
  { id: "s-rohan", slug: "rohan-mehta", fullName: "Rohan Mehta", photoUrl: null, role: "member", status: "hidden", city: "Delhi", industry: "Logistics", cqBatch: "CQ-04", psBatch: "PS-08" },
  { id: "s-nikhil", slug: "nikhil-rao", fullName: "Nikhil Rao", photoUrl: null, role: "member", status: "pending", city: "Hyderabad", industry: "SaaS", cqBatch: "CQ-08", psBatch: "PS-13" },
];

// Resolve the caller's admin context (used by the /admin layout to gate access).
export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await createClient();
  if (!supabase) {
    // Offline preview: allow viewing the (sample) admin so the demo works.
    return { configured: false, role: null, canAccess: true, isAdmin: true, userId: null };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { configured: true, role: null, canAccess: false, isAdmin: false, userId: null };

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Authoritative role model: profiles.role. An existing admin is an admin — no
  // second approval gate. Consultants get access (CRM); members do not.
  const role = (data?.role as Role) ?? "member";
  const isAdmin = role === "admin";
  const canAccess = role === "admin" || role === "consultant";
  return { configured: true, role, canAccess, isAdmin, userId: user.id };
}

export async function getRoster(
  query?: string,
  status?: MemberStatus,
): Promise<RosterMember[]> {
  const supabase = await createClient();
  if (!supabase) return filterRoster(SAMPLE_ROSTER, query, status);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, slug, full_name, photo_url, role, status, city, industry, cq_batch, ps_batch")
    .order("full_name", { ascending: true });

  if (error) {
    if (schemaMissing(error)) return filterRoster(SAMPLE_ROSTER, query, status);
    return [];
  }
  const rows: RosterMember[] = (data ?? []).map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    fullName: r.full_name as string,
    photoUrl: (r.photo_url as string) ?? null,
    role: (r.role as Role) ?? "member",
    status: (r.status as MemberStatus) ?? "active",
    city: (r.city as string) ?? null,
    industry: (r.industry as string) ?? null,
    cqBatch: (r.cq_batch as string) ?? null,
    psBatch: (r.ps_batch as string) ?? null,
  }));
  return filterRoster(rows, query, status);
}

function filterRoster(
  rows: RosterMember[],
  query?: string,
  status?: MemberStatus,
): RosterMember[] {
  let out = rows;
  if (status) out = out.filter((r) => r.status === status);
  const q = query?.trim().toLowerCase();
  if (q) {
    out = out.filter((r) =>
      [r.fullName, r.city, r.industry, r.cqBatch, r.psBatch]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  return out;
}

export async function getConsultants(): Promise<RosterMember[]> {
  const roster = await getRoster();
  return roster.filter((r) => r.role === "consultant" || r.role === "admin");
}

// Members awaiting admin approval (invitation-only gate). Newest-first would need
// a created_at column on the roster; name order is fine for the queue for now.
export async function getPendingMembers(): Promise<RosterMember[]> {
  const roster = await getRoster();
  return roster.filter((r) => r.status === "pending");
}

export async function getRosterMember(id: string): Promise<RosterMember | null> {
  const roster = await getRoster();
  return roster.find((r) => r.id === id) ?? null;
}

// Newest members for the dashboard "Recent signups" card. Uses only operational
// profile fields — NEVER CRM/A1–A22.
export interface RecentSignup {
  id: string;
  slug: string;
  fullName: string;
  role: Role;
  status: MemberStatus;
  joinedAt: string | null;
  completed: boolean;
}
export async function getRecentSignups(limit = 8): Promise<RecentSignup[]> {
  const supabase = await createClient();
  if (!supabase) {
    return SAMPLE_ROSTER.slice(0, limit).map((m) => ({
      id: m.id, slug: m.slug, fullName: m.fullName, role: m.role,
      status: m.status, joinedAt: null, completed: m.status === "active",
    }));
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("id, slug, full_name, role, status, created_at, onboarding_completed_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    fullName: (r.full_name as string) ?? "Member",
    role: (r.role as Role) ?? "member",
    status: (r.status as MemberStatus) ?? "active",
    joinedAt: (r.created_at as string) ?? null,
    completed: Boolean(r.onboarding_completed_at),
  }));
}

// --- Sacred Space team inbox (admin) ---------------------------------------
export interface SupportThread {
  id: string;
  memberName: string; // the member who opened the thread (non-admin side)
  snippet: string;
  lastMessageAt: string | null;
}

// All `support` conversations, newest first. Admins read every support thread via
// RLS (is_admin()); this powers the Sacred Space team inbox so the team can reply.
export async function getSupportConversations(): Promise<SupportThread[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `id, last_message_at, created_by,
       messages ( body, created_at ),
       conversation_members ( profile_id, role, profiles ( full_name ) )`,
    )
    .eq("kind", "support")
    .order("last_message_at", { ascending: false });

  if (error || !data) return [];

  return data.map((c) => {
    const msgs = (c.messages ?? []) as { body: string; created_at: string }[];
    const last = [...msgs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    // The member side = the owner (created_by), else the first non-owner member.
    const members = (c.conversation_members ?? []) as {
      profile_id: string;
      role: string;
      profiles?: { full_name?: string } | { full_name?: string }[];
    }[];
    const owner = members.find((m) => m.profile_id === c.created_by) ?? members[0];
    const p = Array.isArray(owner?.profiles) ? owner?.profiles[0] : owner?.profiles;
    return {
      id: c.id as string,
      memberName: p?.full_name ?? "Member",
      snippet: last?.body ?? "",
      lastMessageAt: (c.last_message_at as string) ?? null,
    };
  });
}
