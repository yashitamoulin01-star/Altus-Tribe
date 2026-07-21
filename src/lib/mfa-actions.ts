"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// TOTP multi-factor auth (Level 4). Enrollment + management live on
// /settings/security; the login-time challenge lives on /mfa. All calls run as
// the signed-in user via the cookie session.

export type EnrollResult =
  | { ok: true; factorId: string; qr: string; secret: string }
  | { ok: false; error: string };

// Start enrolling an authenticator app: returns a QR (SVG) + secret to scan.
// The factor stays unverified until verifyTotpEnrollment succeeds.
export async function enrollTotp(): Promise<EnrollResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Auth is not configured." };
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error || !data) return { ok: false, error: error?.message ?? "Enroll failed." };
  return { ok: true, factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

// Confirm enrollment with the first code from the authenticator app. On success
// the factor becomes verified and the session is elevated to aal2.
export async function verifyTotpEnrollment(
  factorId: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Auth is not configured." };
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: code.trim(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/security");
  return { ok: true };
}

// Remove an enrolled authenticator.
export async function removeTotp(
  factorId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Auth is not configured." };
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/security");
  return { ok: true };
}

// Login-time challenge: verify a code against the user's enrolled factor to
// elevate the session from aal1 → aal2.
export async function verifyMfaChallenge(
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Auth is not configured." };
  const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
  if (fErr) return { ok: false, error: fErr.message };
  const totp = factors?.totp?.[0];
  if (!totp) return { ok: false, error: "No authenticator enrolled." };
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: totp.id,
    code: code.trim(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
