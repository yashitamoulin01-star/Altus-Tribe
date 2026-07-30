"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { messageBodySchema, uuidSchema } from "@/lib/validation/actions";

const groupTitleSchema = z.string().trim().min(2, "Name too short").max(80, "Name too long");
const memberIdsSchema = z.array(uuidSchema).min(1, "Pick at least one member").max(100);

// Messaging server actions (docs/11). No-ops gracefully when Supabase is
// unconfigured/unmigrated so the sample UI stays interactive-safe.

export type SendResult = { ok: boolean; error?: string };

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<SendResult> {
  if (!uuidSchema.safeParse(conversationId).success)
    return { ok: false, error: "invalid" };
  const parsed = messageBodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const text = parsed.data;

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "offline" };

  const user = await getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  // Per-user spam guard: 20 messages / 10s. Keyed by user id (not IP) so it
  // travels with the account, not the network.
  if (!rateLimit(`msg:${user.id}`, 20, 10_000).ok)
    return { ok: false, error: "rate-limited" };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: text,
  });
  if (error) {
    logError("sendMessage", error, { userId: user.id });
    return { ok: false, error: "send-failed" };
  }

  // In-app notifications are created by the `messages_notify` DB trigger
  // (migration 0013) — SECURITY DEFINER, so it isn't blocked by the notifications
  // RLS the way a client-side insert would be. Here we only gather recipients +
  // the sender name to drive the separate Web Push delivery.
  const { data: members } = await supabase
    .from("conversation_members")
    .select("profile_id")
    .eq("conversation_id", conversationId)
    .neq("profile_id", user.id);

  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const senderName = me?.full_name ?? "A member";
  const recipientIds = (members ?? []).map((m) => m.profile_id as string);

  // Fan out a Web Push to recipients' devices (respects prefs + prunes dead subs
  // inside the Edge Function). Fire-and-forget: a missing/undeployed function or
  // an offline env must never fail the send.
  if (recipientIds.length) {
    try {
      await supabase.functions.invoke("push-fanout", {
        headers: process.env.PUSH_FANOUT_SECRET
          ? { "x-push-secret": process.env.PUSH_FANOUT_SECRET }
          : undefined,
        body: {
          recipientIds,
          title: `${senderName} sent you a message`,
          body: text.slice(0, 140),
          link: `/messages/${conversationId}`,
          tag: `conv-${conversationId}`,
          prefKey: "messages",
        },
      });
    } catch (err) {
      logError("sendMessage.push", err, { userId: user.id });
    }
  }

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return { ok: true };
}

// Resolve (or create) a 1:1 conversation between the caller and another member.
export async function getOrCreateDirectConversation(
  otherProfileId: string,
): Promise<{ id: string | null; error?: string }> {
  if (!uuidSchema.safeParse(otherProfileId).success)
    return { id: null, error: "invalid" };

  const supabase = await createClient();
  if (!supabase) return { id: null, error: "offline" };

  const user = await getUser();
  if (!user) return { id: null, error: "unauthenticated" };
  if (user.id === otherProfileId) return { id: null, error: "self" };

  // Look for an existing direct conversation shared by both members.
  const { data: mine } = await supabase
    .from("conversation_members")
    .select("conversation_id, conversations!inner ( kind )")
    .eq("profile_id", user.id);

  const directIds = (mine ?? [])
    .filter((r) => {
      const c = Array.isArray(r.conversations) ? r.conversations[0] : r.conversations;
      return c?.kind === "direct";
    })
    .map((r) => r.conversation_id as string);

  if (directIds.length) {
    const { data: shared } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("profile_id", otherProfileId)
      .in("conversation_id", directIds)
      .limit(1)
      .maybeSingle();
    if (shared?.conversation_id) return { id: shared.conversation_id as string };
  }

  // None yet — create it and add both members.
  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({ kind: "direct", created_by: user.id })
    .select("id")
    .single();
  if (error || !conv) {
    if (error) logError("getOrCreateDirectConversation", error, { userId: user.id });
    return { id: null, error: "create-failed" };
  }

  // Add members in TWO steps, not one. The conversation_members INSERT policy
  // ("join conversations") allows a row when profile_id = auth.uid() OR the
  // caller is already a member. In a single multi-row insert the caller's own
  // membership isn't visible yet, so the OTHER member's row fails the RLS check
  // and the whole insert is rejected — leaving an orphaned, memberless
  // conversation (getConversation → null, sendMessage → "send-failed").
  // Inserting self first makes is_conversation_member() true for the second row.
  const { error: selfErr } = await supabase
    .from("conversation_members")
    .insert({ conversation_id: conv.id, profile_id: user.id, role: "owner" });
  if (selfErr) {
    logError("getOrCreateDirectConversation.self", selfErr, { userId: user.id });
    return { id: null, error: "create-failed" };
  }
  const { error: otherErr } = await supabase
    .from("conversation_members")
    .insert({ conversation_id: conv.id, profile_id: otherProfileId });
  if (otherErr) {
    logError("getOrCreateDirectConversation.other", otherErr, { userId: user.id });
    return { id: null, error: "create-failed" };
  }

  return { id: conv.id as string };
}

// Create a group conversation: the caller becomes owner, then the picked members
// are added. Mirrors the two-step add from getOrCreateDirectConversation — the
// conversation_members INSERT policy only lets us add OTHERS once the caller's own
// membership row exists (is_conversation_member becomes true).
export async function createGroup(
  title: string,
  memberIds: string[],
): Promise<{ id: string | null; error?: string }> {
  const t = groupTitleSchema.safeParse(title);
  if (!t.success) return { id: null, error: t.error.issues[0].message };
  const ids = memberIdsSchema.safeParse(memberIds);
  if (!ids.success) return { id: null, error: ids.error.issues[0].message };

  const supabase = await createClient();
  if (!supabase) return { id: null, error: "offline" };

  const user = await getUser();
  if (!user) return { id: null, error: "unauthenticated" };

  // Dedupe + drop the caller from the invitee list (they're added as owner below).
  const invitees = [...new Set(ids.data)].filter((id) => id !== user.id);

  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({ kind: "group", title: t.data, created_by: user.id })
    .select("id")
    .single();
  if (error || !conv) {
    if (error) logError("createGroup", error, { userId: user.id });
    return { id: null, error: "create-failed" };
  }
  const convId = conv.id as string;

  const { error: selfErr } = await supabase
    .from("conversation_members")
    .insert({ conversation_id: convId, profile_id: user.id, role: "owner" });
  if (selfErr) {
    logError("createGroup.self", selfErr, { userId: user.id });
    return { id: null, error: "create-failed" };
  }

  if (invitees.length) {
    const { error: addErr } = await supabase
      .from("conversation_members")
      .insert(invitees.map((profile_id) => ({ conversation_id: convId, profile_id })));
    if (addErr) {
      // Group is still usable (owner is in it); surface a soft warning.
      logError("createGroup.members", addErr, { userId: user.id });
    }
  }

  revalidatePath("/messages");
  return { id: convId };
}

// Add more members to an existing group. Allowed for any current member by the
// 0006 conversation_members INSERT policy (is_conversation_member check).
export async function addGroupMembers(
  conversationId: string,
  memberIds: string[],
): Promise<SendResult> {
  if (!uuidSchema.safeParse(conversationId).success) return { ok: false, error: "invalid" };
  const ids = memberIdsSchema.safeParse(memberIds);
  if (!ids.success) return { ok: false, error: ids.error.issues[0].message };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "offline" };
  const user = await getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const rows = [...new Set(ids.data)].map((profile_id) => ({
    conversation_id: conversationId,
    profile_id,
  }));
  // Ignore duplicates so re-adding an existing member is a harmless no-op.
  const { error } = await supabase
    .from("conversation_members")
    .upsert(rows, { onConflict: "conversation_id,profile_id", ignoreDuplicates: true });
  if (error) {
    logError("addGroupMembers", error, { userId: user.id });
    return { ok: false, error: "add-failed" };
  }

  revalidatePath(`/messages/${conversationId}`);
  return { ok: true };
}

// Leave a group: remove the caller's own membership row. Requires the DELETE
// policy from migration 0022; until that's applied this returns a safe failure.
export async function leaveGroup(conversationId: string): Promise<SendResult> {
  if (!uuidSchema.safeParse(conversationId).success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "offline" };
  const user = await getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("conversation_members")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("profile_id", user.id);
  if (error) {
    logError("leaveGroup", error, { userId: user.id });
    return { ok: false, error: "leave-failed" };
  }

  revalidatePath("/messages");
  return { ok: true };
}
