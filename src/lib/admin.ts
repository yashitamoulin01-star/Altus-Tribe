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
  canAccess: boolean; // approved admin or consultant
  isAdmin: boolean; // role admin AND approved
  adminApproved: boolean; // role admin but approval status (false = pending)
  pendingAdmin: boolean; // role admin but NOT yet approved
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
    return { configured: false, role: null, canAccess: true, isAdmin: true, adminApproved: true, pendingAdmin: false, userId: null };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { configured: true, role: null, canAccess: false, isAdmin: false, adminApproved: false, pendingAdmin: false, userId: null };

  const { data } = await supabase
    .from("profiles")
    .select("role, admin_approved")
    .eq("id", user.id)
    .maybeSingle();

  const role = (data?.role as Role) ?? "member";
  const adminApproved = Boolean(data?.admin_approved);
  // An admin must be approved by another admin before they can use admin features.
  const isAdmin = role === "admin" && adminApproved;
  const pendingAdmin = role === "admin" && !adminApproved;
  const canAccess = isAdmin || role === "consultant";
  return { configured: true, role, canAccess, isAdmin, adminApproved, pendingAdmin, userId: user.id };
}

// Admins awaiting access approval (role='admin', not yet approved). Shown to
// approved admins on the Admins page so they can grant or deny access.
export interface AdminRow {
  id: string;
  fullName: string;
  slug: string;
  approved: boolean;
}
export async function getAdmins(): Promise<AdminRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, slug, admin_approved")
    .eq("role", "admin")
    .order("full_name");
  return (data ?? []).map((r) => ({
    id: r.id as string,
    fullName: r.full_name as string,
    slug: r.slug as string,
    approved: Boolean(r.admin_approved),
  }));
}

export async function getRoster(query?: string): Promise<RosterMember[]> {
  const supabase = await createClient();
  if (!supabase) return filterRoster(SAMPLE_ROSTER, query);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, slug, full_name, photo_url, role, status, city, industry, cq_batch, ps_batch")
    .order("full_name", { ascending: true });

  if (error) {
    if (schemaMissing(error)) return filterRoster(SAMPLE_ROSTER, query);
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
  return filterRoster(rows, query);
}

function filterRoster(rows: RosterMember[], query?: string): RosterMember[] {
  const q = query?.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) =>
    [r.fullName, r.city, r.industry, r.cqBatch, r.psBatch]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
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
