"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPostAuthRedirect } from "@/lib/onboarding";

export type AuthState = { error: string } | null;

function notConfigured(): AuthState {
  return {
    error:
      "Sign-in is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and _ANON_KEY to .env.local.",
  };
}

async function siteOrigin() {
  const h = await headers();
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`
  );
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return notConfigured();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  // Honor an explicit protected-route redirect; otherwise route through
  // onboarding until the member's feature is complete.
  if (redirectTo && redirectTo !== "/account") redirect(redirectTo);
  redirect(await getPostAuthRedirect());
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return notConfigured();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is disabled, we're signed in immediately — go build
  // the feature. Otherwise ask the member to confirm their email first.
  if (data.session) redirect("/onboarding");
  redirect("/login?check_email=1");
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return notConfigured();

  const email = String(formData.get("email") ?? "").trim();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/reset-password`,
  });
  if (error) return { error: error.message };

  redirect("/forgot-password?sent=1");
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return notConfigured();

  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/account");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
