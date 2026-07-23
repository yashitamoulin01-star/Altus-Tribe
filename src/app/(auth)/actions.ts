"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPostAuthRedirect } from "@/lib/onboarding";
import { rateLimit, ipKey } from "@/lib/rate-limit";
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

// Per-IP throttle for an auth endpoint. Returns an AuthState error when the
// caller is over budget, or null to proceed. Keeps brute-force / email-bombing
// in check before we ever call Supabase Auth.
async function throttle(
  namespace: string,
  limit: number,
  windowMs: number,
): Promise<AuthState> {
  const { ok, retryAfterSec } = rateLimit(await ipKey(namespace), limit, windowMs);
  if (ok) return null;
  return {
    error: `Too many attempts. Please try again in ${retryAfterSec ?? 60}s.`,
  };
}

function notConfigured(): AuthState {
  return {
    error:
      "Sign-in is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and _ANON_KEY to .env.local.",
  };
}

async function siteOrigin() {
  const h = await headers();
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
  return rawUrl.replace(/\/+$/, "");
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return notConfigured();

  const limited = await throttle("login", 10, 5 * 60_000);
  if (limited) return limited;

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

  // One login for everyone. Identity is authenticated here; the authoritative
  // role (profiles.role) is resolved by getPostAuthRedirect — admins/consultants
  // bypass onboarding, members go through it. No role selection at login.
  if (redirectTo && redirectTo !== "/account") redirect(redirectTo);
  redirect(await getPostAuthRedirect());
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return notConfigured();

  const limited = await throttle("signup", 5, 10 * 60_000);
  if (limited) return limited;

  const parsed = signupSchema.safeParse({
    fullName: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const captchaToken = String(formData.get("captchaToken") ?? "") || undefined;

  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback`,
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

  const limited = await throttle("resend", 5, 15 * 60_000);
  if (limited) return limited;

  const parsed = emailOnlySchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const captchaToken = String(formData.get("captchaToken") ?? "") || undefined;
  const origin = await siteOrigin();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
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

  const { ok, retryAfterSec } = rateLimit(await ipKey("magic-link"), 5, 15 * 60_000);
  if (!ok) return { error: `Too many attempts. Please try again in ${retryAfterSec ?? 60}s.` };

  const parsed = emailOnlySchema.safeParse({ email: email.trim() });
  if (!parsed.success) return { fieldError: fieldErrorsFrom(parsed.error).email };

  const origin = await siteOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback`,
      captchaToken: captchaToken || undefined,
    },
  });
  if (error) {
    // Supabase returns this when shouldCreateUser:false and the email has no account.
    // Translate it into something a member can actually act on.
    if (
      error.message.toLowerCase().includes('signups not allowed') ||
      error.message.toLowerCase().includes('otp') ||
      error.message.toLowerCase().includes('not found')
    ) {
      return {
        error:
          'Account not found. Magic links are not for new users — please register first.',
      };
    }
    return { error: error.message };
  }

  return { ok: true };
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return notConfigured();

  const limited = await throttle("reset", 5, 15 * 60_000);
  if (limited) return limited;

  const parsed = emailOnlySchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const captchaToken = String(formData.get("captchaToken") ?? "") || undefined;

  const origin = await siteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
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

  redirect("/login?reset_success=1");
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
