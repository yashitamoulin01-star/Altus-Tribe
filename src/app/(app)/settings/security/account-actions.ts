"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Revoke every OTHER session (keeps the current device signed in). No
// service-role needed — the user acts on their own sessions.
export async function signOutOtherSessions(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Auth is not configured." };
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Permanently delete the caller's own account via the delete_own_account RPC
// (SECURITY DEFINER, guarded by auth.uid()), then sign out and go to /login.
export async function deleteAccount(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Auth is not configured." };
  const { error } = await supabase.rpc("delete_own_account");
  if (error) return { ok: false, error: error.message };
  await supabase.auth.signOut();
  redirect("/login");
}
