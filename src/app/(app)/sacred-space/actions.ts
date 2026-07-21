"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";

// Ask Manan (Phase 5.4): resolve-or-create the member's support conversation
// with the Manan/team side (the founding admin). Support conversations are
// visible to all admins via RLS; adding the admin as a member lets them reply.
export async function askManan(): Promise<{ id: string | null }> {
  const supabase = await createClient();
  if (!supabase) return { id: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: null };

  // Existing support conversation I'm already in?
  const { data: mine } = await supabase
    .from("conversation_members")
    .select("conversation_id, conversations!inner ( kind )")
    .eq("profile_id", user.id);
  const existing = (mine ?? []).find((r) => {
    const c = Array.isArray(r.conversations) ? r.conversations[0] : r.conversations;
    return c?.kind === "support";
  });
  if (existing) return { id: existing.conversation_id as string };

  // "Manan" = the founding admin (oldest admin account).
  const { data: manan } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({ kind: "support", title: "Manan & Team", created_by: user.id })
    .select("id")
    .single();
  if (error || !conv) {
    if (error) logError("askManan", error, { userId: user.id });
    return { id: null };
  }

  // Add myself first (RLS: profile_id = auth.uid). Once I'm a member I'm allowed
  // to add the admin (is_conversation_member becomes true).
  await supabase
    .from("conversation_members")
    .insert({ conversation_id: conv.id, profile_id: user.id, role: "owner" });
  const mananId = manan?.id as string | undefined;
  if (mananId && mananId !== user.id) {
    await supabase
      .from("conversation_members")
      .insert({ conversation_id: conv.id, profile_id: mananId, role: "member" });
  }

  return { id: conv.id as string };
}
