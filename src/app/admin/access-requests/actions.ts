"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAdminContext } from "@/lib/admin";
import { adminReviewService } from "@/lib/access/container";
import type { AdminRole } from "@/lib/access/types";

async function ctx(): Promise<{ role: AdminRole; actorId: string; ip: string }> {
  const a = await getAdminContext();
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : h.get("x-real-ip") ?? "").trim() || "unknown";
  // Map the app's admin/consultant roles onto the access-control roles:
  // full admins decide; consultants act as Reviewers (read + recommend).
  return { role: a.isAdmin ? "Admin" : "Reviewer", actorId: a.userId ?? "preview-admin", ip };
}

export async function decideRequest(input: {
  requestId: string;
  action: "approve" | "reject";
  rejectionReason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { role, actorId, ip } = await ctx();
  const r = await adminReviewService().decide({ ...input, role, actorId, ip });
  if (r.ok) revalidatePath("/admin/access-requests");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function bulkDecide(input: {
  requestIds: string[];
  action: "approve" | "reject";
  typedCount: number;
}): Promise<{ ok: boolean; count?: number; error?: string }> {
  const { role, actorId, ip } = await ctx();
  const r = await adminReviewService().bulkDecide({ ...input, role, actorId, ip });
  if (r.ok) revalidatePath("/admin/access-requests");
  return r.ok ? { ok: true, count: r.count } : { ok: false, error: r.error };
}

export async function suspendMember(allowlistId: string): Promise<{ ok: boolean; error?: string }> {
  const { role, actorId, ip } = await ctx();
  const r = await adminReviewService().suspend({ allowlistId, role, actorId, ip });
  if (r.ok) revalidatePath("/admin/access-requests");
  return r;
}

export async function addNote(allowlistId: string, note: string): Promise<{ ok: boolean }> {
  const { actorId, ip } = await ctx();
  await adminReviewService().addNote({ allowlistId, note, actorId, ip });
  revalidatePath("/admin/access-requests");
  return { ok: true };
}

// Resume download link — always audited. In mock mode returns a placeholder
// (real signed URLs need the private bucket — checklist §C).
export async function resumeUrl(requestId: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const { role, actorId, ip } = await ctx();
  const r = await adminReviewService().resumeDownloadUrl({ requestId, role, actorId, ip });
  return r.ok ? { ok: true, url: r.url } : { ok: false, error: r.error };
}
