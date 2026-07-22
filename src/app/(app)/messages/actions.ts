"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { messageBodySchema, uuidSchema } from "@/lib/validation/actions";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  await supabase.from("conversation_members").insert([
    { conversation_id: conv.id, profile_id: user.id, role: "owner" },
    { conversation_id: conv.id, profile_id: otherProfileId },
  ]);

  return { id: conv.id as string };
}
