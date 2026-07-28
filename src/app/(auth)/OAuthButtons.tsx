"use client";

import { useState } from "react";
import { signInWithProvider } from "./actions";

// Primary sign-in providers for the login card (owner spec 2026-07-28):
//   • Continue with Google              — REAL Supabase PKCE OAuth.
//   • Continue with Productivity Shastra — SSO for existing PS users.
// Apple is intentionally REMOVED until an Apple Developer account exists.
//
// Google posts to the signInWithProvider server action. If the Google provider
// isn't enabled in Supabase yet, the action redirects to /login?error=oauth — an
// honest failure, never a fake success.
//
// Productivity Shastra SSO is PREPARED-BUT-UNCONNECTED: the two apps are meant to
// share one identity, but that needs the PS identity bridge (OIDC / signed-JWT +
// session-validation endpoints) from the PS team — see
// docs/17-infrastructure-readiness-checklist.md §Auth. Rather than fake a login,
// the button is prominent and, until the bridge is live, explains what's pending.

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 01-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.09A12 12 0 0012 24z" />
    <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 010-4.56V6.63H1.26a12 12 0 000 10.74l4.01-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0012 0 12 12 0 001.26 6.63l4.01 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

const PS_ICON = (
  <span
    aria-hidden
    className="grid h-[18px] w-[18px] place-items-center rounded-[3px] bg-[#c8102e] text-[8px] font-bold leading-none tracking-tighter text-white"
  >
    PS
  </span>
);

const btn =
  "flex h-11 w-full items-center justify-center gap-2.5 rounded-[4px] border border-[#e4e4e2] bg-white text-[14px] font-semibold text-[#111111] transition-colors duration-200 hover:border-[#111111]";

export default function OAuthButtons() {
  const [psNote, setPsNote] = useState(false);

  return (
    <div className="mb-3 flex flex-col gap-2">
      <form action={signInWithProvider}>
        <input type="hidden" name="provider" value="google" />
        <button type="submit" aria-label="Continue with Google" className={btn}>
          {GOOGLE_ICON}
          Continue with Google
        </button>
      </form>

      <button
        type="button"
        onClick={() => setPsNote((v) => !v)}
        aria-label="Continue with Productivity Shastra"
        className={btn}
      >
        {PS_ICON}
        Continue with Productivity Shastra
      </button>

      {psNote && (
        <p className="rounded-[4px] border border-[#f0d4d8] bg-[#fdf2f3] px-3 py-2 text-[12px] leading-relaxed text-[#8a1420]">
          Single sign-on with Productivity Shastra is being connected. Once the PS
          identity bridge is live, existing PS members sign in here with one shared
          account — no new password. For now, please use Google or your email below.
        </p>
      )}

      <div className="mt-1 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#e4e4e2]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#9a9a9a]">or</span>
        <span className="h-px flex-1 bg-[#e4e4e2]" />
      </div>
    </div>
  );
}
