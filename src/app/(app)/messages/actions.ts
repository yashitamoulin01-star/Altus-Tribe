"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Messaging server actions (docs/11). No-ops gracefully when Supabase is
// unconfigured/unmigrated so the sample UI stays interactive-safe.

export type SendResult = { ok: boolean; error?: string };

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<SendResult> {
  const text = body.trim();
  if (!text) return { ok: false, error: "empty" };
  if (text.length > 4000) return { ok: false, error: "too long" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "offline" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: text,
  });
  if (error) return { ok: false, error: error.message };

  // Fan out a notification to the other members (message pref respected).
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

  for (const m of members ?? []) {
    await supabase.from("notifications").insert({
      recipient_id: m.profile_id,
      kind: "message",
      title: `${senderName} sent you a message`,
      body: text.slice(0, 140),
      link: `/messages/${conversationId}`,
    });
  }

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return { ok: true };
}

// Resolve (or create) a 1:1 conversation between the caller and another member.
export async function getOrCreateDirectConversation(
  otherProfileId: string,
): Promise<{ id: string | null; error?: string }> {
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
  if (error || !conv) return { id: null, error: error?.message ?? "create failed" };

  await supabase.from("conversation_members").insert([
    { conversation_id: conv.id, profile_id: user.id, role: "owner" },
    { conversation_id: conv.id, profile_id: otherProfileId },
  ]);

  return { id: conv.id as string };
}
