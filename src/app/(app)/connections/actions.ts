"use server";

import { getUser as getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import { badId } from "@/lib/validation/actions";

// Connection request actions (Phase 5, Tribe). Each re-checks auth; RLS enforces
// that only participants touch a row. No-op safely offline.

export type ConnResult = { ok: boolean; error?: string };

// Notifications for connection request/accept are created by the
// `connections_notify` DB trigger (migration 0013) — SECURITY DEFINER, so it
// isn't blocked by the notifications RLS the way a client-side insert would be.

// Send (or auto-accept a reverse) connection request.
export async function sendConnectionRequest(addresseeId: string): Promise<ConnResult> {
  if (badId(addresseeId)) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "offline" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  if (user.id === addresseeId) return { ok: false, error: "self" };

  // If they already requested me, accept that instead of creating a duplicate
  // (the trigger then notifies the original requester).
  const { data: reverse } = await supabase
    .from("connections")
    .select("id")
    .eq("requester_id", addresseeId)
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .maybeSingle();
  if (reverse) {
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", reverse.id);
    if (error) {
      logError("sendConnectionRequest.accept", error, { userId: user.id });
      return { ok: false, error: "failed" };
    }
    revalidatePath("/connections");
    return { ok: true };
  }

  const { error } = await supabase
    .from("connections")
    .upsert(
      { requester_id: user.id, addressee_id: addresseeId, status: "pending" },
      { onConflict: "requester_id,addressee_id" },
    );
  if (error) {
    logError("sendConnectionRequest", error, { userId: user.id });
    return { ok: false, error: "failed" };
  }
  revalidatePath("/connections");
  return { ok: true };
}

// Accept or decline a request someone sent me.
export async function respondToConnection(
  requesterId: string,
  accept: boolean,
): Promise<ConnResult> {
  if (badId(requesterId)) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "offline" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("connections")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("requester_id", requesterId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");
  if (error) {
    logError("respondToConnection", error, { userId: user.id });
    return { ok: false, error: "failed" };
  }
  // On accept, the connections_notify trigger notifies the requester.
  revalidatePath("/connections");
  return { ok: true };
}

// Remove a connection or withdraw a request (either direction).
export async function removeConnection(otherId: string): Promise<ConnResult> {
  if (badId(otherId)) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "offline" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("connections")
    .delete()
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${user.id})`,
    );
  if (error) {
    logError("removeConnection", error, { userId: user.id });
    return { ok: false, error: "failed" };
  }
  revalidatePath("/connections");
  return { ok: true };
}
