"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPostAuthRedirect } from "@/lib/onboarding";
import {
  loginSchema,
  signupSchema,
  emailOnlySchema,
  newPasswordSchema,
  fieldErrorsFrom,
  type FieldErrors,
} from "@/lib/validation/auth";
import { OAUTH_PROVIDERS, type OAuthProvider } from "./oauth-providers";

export type AuthState = {
  error?: string;
  fieldErrors?: FieldErrors;
  sent?: boolean;
} | null;

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

  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const redirectTo = String(formData.get("redirect") ?? "");
  const captchaToken = String(formData.get("captchaToken") ?? "") || undefined;

  const { error } = await supabase.auth.signInWithPassword({
    ...parsed.data,
    options: { captchaToken },
  });
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

  const parsed = signupSchema.safeParse({
    fullName: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const captchaToken = String(formData.get("captchaToken") ?? "") || undefined;

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
      captchaToken,
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is disabled, we're signed in immediately — go build
  // the feature. Otherwise ask the member to confirm their email first. Carry
  // the email so "resend confirmation" is one click.
  if (data.session) redirect("/onboarding");
  redirect(`/login?check_email=1&email=${encodeURIComponent(parsed.data.email)}`);
}

// Resend the signup confirmation email (#6). Used from the /login?check_email=1
// banner when the first email didn't arrive.
export async function resendConfirmation(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return notConfigured();

  const parsed = emailOnlySchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const captchaToken = String(formData.get("captchaToken") ?? "") || undefined;
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
      captchaToken,
    },
  });
  if (error) return { error: error.message };

  return { sent: true };
}

// Passwordless sign-in (magic link). Login-only (shouldCreateUser: false) so it
// can't bypass the invitation-only signup gate — new members must go through
// signup, which creates a `pending` profile. Called imperatively from the login
// form with the typed email.
export async function sendMagicLink(
  email: string,
  captchaToken?: string,
): Promise<{ ok?: boolean; error?: string; fieldError?: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Sign-in is not configured yet." };

  const parsed = emailOnlySchema.safeParse({ email: email.trim() });
  if (!parsed.success) return { fieldError: fieldErrorsFrom(parsed.error).email };

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
      captchaToken: captchaToken || undefined,
    },
  });
  if (error) return { error: error.message };

  return { ok: true };
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return notConfigured();

  const parsed = emailOnlySchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const captchaToken = String(formData.get("captchaToken") ?? "") || undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/reset-password`,
    captchaToken,
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

  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  redirect("/account");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}

// Kicks off a social sign-in. Providers must be enabled in Supabase → Auth →
// Providers. Returns a provider URL we redirect the browser to;
// the provider sends the user back to /auth/callback?code=… which the callback
// route exchanges for a session (PKCE — the code-verifier cookie is set here and
// read there). New users get a `pending` profile via the trigger, so OAuth can't
// bypass the invitation-only gate.
export async function signInWithProvider(formData: FormData): Promise<void> {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=oauth");

  const provider = String(formData.get("provider") ?? "");
  if (!OAUTH_PROVIDERS.includes(provider as OAuthProvider)) {
    redirect("/login?error=oauth");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as OAuthProvider,
    options: { redirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error || !data?.url) redirect("/login?error=oauth");
  redirect(data.url);
}
