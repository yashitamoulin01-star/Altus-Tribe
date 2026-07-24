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

// --- Events (ADMIN-7) -------------------------------------------------------
export interface EventInput {
  id?: string;
  title: string;
  description: string;
  location: string;
  link: string;
  startsAt: string; // ISO (from a datetime-local input, already normalized)
  endsAt: string;
  featured: boolean;
}

function eventRow(e: EventInput, createdBy?: string | null) {
  return {
    title: e.title.trim(),
    description: e.description.trim() || null,
    location: e.location.trim() || null,
    link: e.link.trim() || null,
    starts_at: e.startsAt,
    ends_at: e.endsAt || null,
    featured: e.featured,
    ...(createdBy ? { created_by: createdBy } : {}),
  };
}

export async function saveEvent(e: EventInput) {
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  if (!e.title.trim() || !e.startsAt) return { ok: false, error: "Title and start time are required." };

  const { error } = e.id
    ? await supabase.from("events").update(eventRow(e)).eq("id", e.id)
    : await supabase.from("events").insert(eventRow(e, ctx.userId));
  if (error) {
    logError("saveEvent", error, { userId: ctx.userId });
    return { ok: false, error: "Couldn't save the event." };
  }
  await logAudit(e.id ? "event.update" : "event.create", {
    entityType: "event",
    entityId: e.id,
  });
  revalidatePath("/admin/events");
  revalidatePath("/home");
  return { ok: true };
}

export async function deleteEvent(id: string) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    logError("deleteEvent", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("event.delete", { entityType: "event", entityId: id });
  revalidatePath("/admin/events");
  revalidatePath("/home");
  return { ok: true };
}

// Sacred Space team inbox: make the current admin a member of a support thread so
// they can reply. The messages INSERT policy requires conversation membership;
// the conversation_members INSERT policy allows is_admin() to join. Idempotent.
export async function joinSupportThread(conversationId: string) {
  if (badId(conversationId)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin || !ctx.userId) return { ok: false };
  const { error } = await supabase
    .from("conversation_members")
    .upsert(
      { conversation_id: conversationId, profile_id: ctx.userId, role: "member" },
      { onConflict: "conversation_id,profile_id", ignoreDuplicates: true },
    );
  if (error) {
    logError("joinSupportThread", error, { userId: ctx.userId });
    return { ok: false };
  }
  return { ok: true };
}

// Invitation-only approval queue. Approve promotes a pending signup to active
// (full access to the worlds); reject parks them as inactive (kept for audit,
// not deleted). Both re-check admin server-side; RLS is the real boundary.
export async function approveMember(id: string) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  // Approving resolves any outstanding change request.
  const { error } = await supabase
    .from("profiles")
    .update({ status: "active", review_state: null, review_note: null })
    .eq("id", id);
  if (error) {
    logError("approveMember", error, { userId: ctx.userId });
    return { ok: false };
  }
  // In-app "you're approved" notification (docs/17 §2 — the in-app half; the
  // email remains an infra item). The notifications INSERT policy allows
  // is_admin() to insert for any recipient (migration 0013), so this admin-side
  // insert is RLS-permitted. Best-effort: a notify failure must not fail the
  // approval itself.
  const { error: notifyError } = await supabase.from("notifications").insert({
    recipient_id: id,
    kind: "system",
    title: "You're approved — welcome to the Tribe",
    body: "Your membership is active. Complete your profile to appear in the member directory.",
    link: "/home",
  });
  if (notifyError) logError("approveMember.notify", notifyError, { userId: ctx.userId });
  await logAudit("member.approve", { entityType: "profile", entityId: id });
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function rejectMember(id: string) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase
    .from("profiles")
    .update({ status: "inactive", review_state: null, review_note: null })
    .eq("id", id);
  if (error) {
    logError("rejectMember", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("member.reject", { entityType: "profile", entityId: id });
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/members");
  return { ok: true };
}

// Request changes: keep the applicant pending but flag them with an admin note
// describing what to fix, instead of a flat reject (docs/17 §1). Passing an empty
// note clears the flag (undo). Members never read these columns.
export async function requestChanges(id: string, note: string) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const trimmed = note.trim().slice(0, 2000);
  const clearing = trimmed.length === 0;
  const { error } = await supabase
    .from("profiles")
    .update({
      status: "pending",
      review_state: clearing ? null : "changes_requested",
      review_note: clearing ? null : trimmed,
    })
    .eq("id", id);
  if (error) {
    logError("requestChanges", error, { userId: ctx.userId });
    return { ok: false };
  }
  // Nudge the applicant to act (docs/17 §1/§2). Only when a note is set —
  // clearing the flag is a silent admin undo. Same RLS-permitted admin insert;
  // best-effort so it never fails the review write. The note is the applicant's
  // own guidance, already surfaced to them on /pending.
  if (!clearing) {
    const { error: notifyError } = await supabase.from("notifications").insert({
      recipient_id: id,
      kind: "system",
      title: "Action needed on your membership",
      body: trimmed,
      link: "/pending",
    });
    if (notifyError) logError("requestChanges.notify", notifyError, { userId: ctx.userId });
  }
  await logAudit(clearing ? "member.review_clear" : "member.request_changes", {
    entityType: "profile",
    entityId: id,
  });
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/members");
  return { ok: true };
}

// Spotlight a member (docs/17 §6): surfaces a "Featured" strip on Explore and
// floats them up in Home suggestions. Public-facing but admin-controlled.
export async function setFeatured(id: string, featured: boolean) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase.from("profiles").update({ is_featured: featured }).eq("id", id);
  if (error) {
    logError("setFeatured", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("member.featured", { entityType: "profile", entityId: id, metadata: { featured } });
  revalidatePath("/admin/members");
  revalidatePath("/explore");
  revalidatePath("/home");
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

const VALID_ROLES: Role[] = ["member", "consultant", "admin"];

// Change a member's role (the canonical promotion/demotion mechanism, e.g.
// "Grant Administrator Access"). Server validates the acting admin, the target,
// and the role enum; guards against removing the last active administrator.
export async function setMemberRole(id: string, role: Role) {
  if (badId(id)) return { ok: false, error: "Invalid request." };
  if (!VALID_ROLES.includes(role)) return { ok: false, error: "Invalid role." };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false, error: "Not authorized." };

  // Zero-admin protection (§13): if this demotes an admin, ensure another active
  // admin remains so the system can never end up with no administrators.
  if (role !== "admin") {
    const { data: target } = await supabase
      .from("profiles").select("role").eq("id", id).maybeSingle();
    if (target?.role === "admin") {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("status", "active");
      if ((count ?? 0) <= 1) {
        return { ok: false, error: "Can't remove the last administrator. Promote another admin first." };
      }
    }
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) {
    logError("setMemberRole", error, { userId: ctx.userId });
    return { ok: false, error: "Couldn't update the role. Please try again." };
  }
  await logAudit("member.role", { entityType: "profile", entityId: id, metadata: { role } });
  revalidatePath("/admin/consultants");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
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

// Pin/unpin an announcement (docs/17 §5): a pinned note floats to the top of
// Sacred Space regardless of publish date.
export async function setAnnouncementPinned(id: string, pinned: boolean) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase
    .from("announcements")
    .update({ pinned_at: pinned ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) {
    logError("setAnnouncementPinned", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("asset.announcement.pin", { entityType: "announcement", entityId: id, metadata: { pinned } });
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

// --- Taxonomies / categories management (docs/17 §6) ------------------------
// The dropdown values that feed the profile editor + Explore filters. Table +
// admin-write RLS already exist (migration 0005); this is the CRUD surface.
const TAXONOMY_KINDS = ["industry", "category", "city", "state", "country"];

export async function addTaxonomy(kind: string, value: string) {
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  if (!TAXONOMY_KINDS.includes(kind)) return { ok: false, error: "Invalid type." };
  const clean = value.trim();
  if (!clean) return { ok: false, error: "Value is required." };
  // Append to the end of its kind (highest sort_order + 1).
  const { data: last } = await supabase
    .from("taxonomies")
    .select("sort_order")
    .eq("kind", kind)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = ((last?.sort_order as number) ?? -1) + 1;
  const { error } = await supabase
    .from("taxonomies")
    .upsert({ kind, value: clean, sort_order }, { onConflict: "kind,value", ignoreDuplicates: true });
  if (error) {
    logError("addTaxonomy", error, { userId: ctx.userId });
    return { ok: false, error: "Couldn't add. Please try again." };
  }
  await logAudit("taxonomy.add", { entityType: "taxonomy", metadata: { kind, value: clean } });
  revalidatePath("/admin/taxonomies");
  return { ok: true };
}

export async function deleteTaxonomy(id: string) {
  if (badId(id)) return { ok: false };
  const { supabase, ctx } = await ensureAdmin();
  if (!supabase || !ctx.isAdmin) return { ok: false };
  const { error } = await supabase.from("taxonomies").delete().eq("id", id);
  if (error) {
    logError("deleteTaxonomy", error, { userId: ctx.userId });
    return { ok: false };
  }
  await logAudit("taxonomy.delete", { entityType: "taxonomy", entityId: id });
  revalidatePath("/admin/taxonomies");
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
