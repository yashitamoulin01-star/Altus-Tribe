"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin";
import type { MemberStatus, Role } from "@/lib/admin";
import type { CrmImpact, RatingTier } from "@/lib/crm";

// Admin server actions (docs/12). Every mutation re-checks role server-side in
// addition to RLS. No-ops safely in offline/preview mode.

async function ensureAdmin() {
  const ctx = await getAdminContext();
  if (!ctx.configured) return { supabase: null, ctx };
  if (!ctx.canAccess) throw new Error("forbidden");
  const supabase = await createClient();
  return { supabase, ctx };
}

export async function setMemberStatus(id: string, status: MemberStatus) {
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  await supabase.from("profiles").update({ status }).eq("id", id);
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  return { ok: true };
}

// Invitation-only approval queue. Approve promotes a pending signup to active
// (full access to the worlds); reject parks them as inactive (kept for audit,
// not deleted). Both re-check admin server-side; RLS is the real boundary.
export async function approveMember(id: string) {
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  await supabase.from("profiles").update({ status: "active" }).eq("id", id);
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function rejectMember(id: string) {
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  await supabase.from("profiles").update({ status: "inactive" }).eq("id", id);
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function deleteMember(id: string) {
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  await supabase.from("profiles").delete().eq("id", id);
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function setMemberRole(id: string, role: Role) {
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/admin/consultants");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function assignConsultant(memberId: string, consultantId: string | null) {
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  // participant_admin is 1:1 with profile; upsert the assignment.
  await supabase
    .from("participant_admin")
    .upsert({ profile_id: memberId, designated_consultant: consultantId });
  revalidatePath(`/admin/members/${memberId}`);
  return { ok: true };
}

export async function saveCrm(input: {
  profileId: string;
  referredBy: string;
  breakthrough: string;
  upsellPossible: boolean;
  rating: RatingTier | null;
  impact: CrmImpact;
}) {
  const { supabase } = await ensureAdmin();
  if (!supabase) return { ok: false };
  // RLS allows admins or the designated consultant to write this row.
  const { error } = await supabase.from("participant_admin").upsert({
    profile_id: input.profileId,
    referred_by: input.referredBy || null,
    breakthrough: input.breakthrough || null,
    upsell_possible: input.upsellPossible,
    rating: input.rating,
    impact: input.impact,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${input.profileId}`);
  return { ok: true };
}

// Moderation (#174): soft-delete a message. Comments don't exist yet; this covers
// the content that does, and extends to comments when that feature ships.
export async function deleteMessage(messageId: string) {
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);
  return { ok: true };
}

// Bulk upload (#167–168): insert mapped rows as profiles. Expects rows already
// parsed + mapped client-side to the canonical field names.
export async function bulkInsertMembers(
  rows: { full_name: string; slug: string; city?: string; industry?: string; category?: string; cq_batch?: string; ps_batch?: string }[],
) {
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false, inserted: 0 };
  const clean = rows.filter((r) => r.full_name?.trim() && r.slug?.trim());
  if (!clean.length) return { ok: false, inserted: 0 };
  const { error, count } = await supabase
    .from("profiles")
    .insert(clean, { count: "exact" });
  if (error) return { ok: false, inserted: 0, error: error.message };
  revalidatePath("/admin/members");
  return { ok: true, inserted: count ?? clean.length };
}
