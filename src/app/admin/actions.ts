"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin";
import { logError } from "@/lib/logger";
import { logAudit } from "@/lib/audit";
import { badId } from "@/lib/validation/actions";
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
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  if (error) {
    logError("setMemberStatus", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("member.status", { entityType: "profile", entityId: id, metadata: { status } });
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  return { ok: true };
}

// Invitation-only approval queue. Approve promotes a pending signup to active
// (full access to the worlds); reject parks them as inactive (kept for audit,
// not deleted). Both re-check admin server-side; RLS is the real boundary.
export async function approveMember(id: string) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase.from("profiles").update({ status: "active" }).eq("id", id);
  if (error) {
    logError("approveMember", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("member.approve", { entityType: "profile", entityId: id });
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function rejectMember(id: string) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase.from("profiles").update({ status: "inactive" }).eq("id", id);
  if (error) {
    logError("rejectMember", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("member.reject", { entityType: "profile", entityId: id });
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function deleteMember(id: string) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) {
    logError("deleteMember", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("member.delete", { entityType: "profile", entityId: id });
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function setMemberRole(id: string, role: Role) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) {
    logError("setMemberRole", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("member.role", { entityType: "profile", entityId: id, metadata: { role } });
  revalidatePath("/admin/consultants");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function assignConsultant(memberId: string, consultantId: string | null) {
  if (badId(memberId)) return { ok: false };
  if (consultantId !== null && badId(consultantId)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  // participant_admin is 1:1 with profile; upsert the assignment.
  const { error } = await supabase
    .from("participant_admin")
    .upsert({ profile_id: memberId, designated_consultant: consultantId });
  if (error) {
    logError("assignConsultant", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("member.assign_consultant", {
    entityType: "profile",
    entityId: memberId,
    metadata: { consultantId },
  });
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
  if (badId(input.profileId)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
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
  if (error) {
    logError("saveCrm", error, { userId: ctx.userId });
    return { ok: false, error: "Couldn't save. Please try again." };
  }
  revalidatePath(`/admin/members/${input.profileId}`);
  return { ok: true };
}

// Private CRM assets A3–A9 + A21 (participant_assets). Replace-all: the editor
// sends the full slot set, we drop the member's existing rows and re-insert the
// non-empty ones. RLS lets admins (is_admin) or the designated consultant write.
export async function saveCrmAssets(
  profileId: string,
  assets: { kind: string; body: string; url: string; image: string }[],
) {
  if (badId(profileId)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase) return { ok: false };

  const rows = assets
    .filter((a) => a.body.trim() || a.url.trim() || a.image.trim())
    .map((a) => ({
      profile_id: profileId,
      kind: a.kind,
      body: a.body.trim() || null,
      url: a.url.trim() || null,
      image_path: a.image.trim() || null,
    }));

  const { error: delErr } = await supabase
    .from("participant_assets")
    .delete()
    .eq("profile_id", profileId);
  if (delErr) {
    logError("saveCrmAssets", delErr, { userId: ctx.userId });
    return { ok: false, error: "Couldn't save assets. Please try again." };
  }
  if (rows.length) {
    const { error: insErr } = await supabase.from("participant_assets").insert(rows);
    if (insErr) {
      logError("saveCrmAssets", insErr, { userId: ctx.userId });
      return { ok: false, error: "Couldn't save assets. Please try again." };
    }
  }
  revalidatePath(`/admin/members/${profileId}`);
  return { ok: true };
}

// Moderation (#174): soft-delete a message. Comments don't exist yet; this covers
// the content that does, and extends to comments when that feature ships.
export async function deleteMessage(messageId: string) {
  if (badId(messageId)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);
  if (error) {
    logError("deleteMessage", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("message.delete", { entityType: "message", entityId: messageId });
  return { ok: true };
}

// --- Asset Manager (Phase 5.5): announcements + Campus resources -----------
// Inserts fire the 0013 notification triggers (announcement/resource → members).

export async function createAnnouncement(input: {
  title: string;
  body: string;
  publish: boolean;
}) {
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  if (!input.title.trim()) return { ok: false, error: "Title is required." };
  const { error } = await supabase.from("announcements").insert({
    title: input.title.trim(),
    body: input.body.trim() || null,
    author_id: ctx.userId,
    published_at: input.publish ? new Date().toISOString() : null,
  });
  if (error) {
    logError("createAnnouncement", error, { userId: ctx.userId });
    return { ok: false, error: "Couldn't publish. Please try again." };
  }
  await logAudit("asset.announcement.create", {
    entityType: "announcement",
    metadata: { title: input.title.trim(), published: input.publish },
  });
  revalidatePath("/admin/assets");
  revalidatePath("/sacred-space");
  return { ok: true };
}

export async function deleteAnnouncement(id: string) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) {
    logError("deleteAnnouncement", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("asset.announcement.delete", { entityType: "announcement", entityId: id });
  revalidatePath("/admin/assets");
  revalidatePath("/sacred-space");
  return { ok: true };
}

export async function createResource(input: {
  kind: string;
  title: string;
  description: string;
  externalUrl: string;
  filePath: string;
}) {
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  if (!["video", "brochure", "inspiration"].includes(input.kind))
    return { ok: false, error: "Invalid type." };
  if (!input.title.trim()) return { ok: false, error: "Title is required." };
  const { error } = await supabase.from("resources").insert({
    kind: input.kind,
    title: input.title.trim(),
    description: input.description.trim() || null,
    external_url: input.externalUrl.trim() || null,
    file_path: input.filePath.trim() || null,
    created_by: ctx.userId,
  });
  if (error) {
    logError("createResource", error, { userId: ctx.userId });
    return { ok: false, error: "Couldn't add. Please try again." };
  }
  await logAudit("asset.resource.create", {
    entityType: "resource",
    metadata: { title: input.title.trim(), kind: input.kind },
  });
  revalidatePath("/admin/assets");
  revalidatePath("/campus");
  return { ok: true };
}

export async function deleteResource(id: string) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) {
    logError("deleteResource", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("asset.resource.delete", { entityType: "resource", entityId: id });
  revalidatePath("/admin/assets");
  revalidatePath("/campus");
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
  if (error) {
    logError("bulkInsertMembers", error, { userId: ctx.userId });
    return { ok: false, inserted: 0, error: "Import failed. Check the file and try again." };
  }
  revalidatePath("/admin/members");
  return { ok: true, inserted: count ?? clean.length };
}
