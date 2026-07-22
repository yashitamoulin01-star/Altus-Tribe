"use client";

import { useSignIn } from "@clerk/nextjs/legacy";
import { type OAuthProvider } from "./oauth-providers";

// Social sign-in buttons (Clerk). Renders only the providers listed in
// NEXT_PUBLIC_OAUTH_PROVIDERS (comma-separated, e.g. "google,linkedin_oidc"),
// so no broken buttons show before a provider is enabled in the Clerk Dashboard.
// Each starts Clerk's OAuth redirect flow; completion lands on /sso-callback.

const CLERK_STRATEGY: Record<
  OAuthProvider,
  "oauth_google" | "oauth_apple" | "oauth_linkedin_oidc"
> = {
  linkedin_oidc: "oauth_linkedin_oidc",
  google: "oauth_google",
  apple: "oauth_apple",
};

const META: Record<OAuthProvider, { label: string; icon: React.ReactNode }> = {
  linkedin_oidc: {
    label: "LinkedIn",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden>
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
      </svg>
    ),
  },
  google: {
    label: "Google",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 01-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.09A12 12 0 0012 24z" />
        <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 010-4.56V6.63H1.26a12 12 0 000 10.74l4.01-3.09z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0012 0 12 12 0 001.26 6.63l4.01 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
      </svg>
    ),
  },
  apple: {
    label: "Apple",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000" aria-hidden>
        <path d="M17.05 12.7c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.15-.46 7.8 1.3 10.35.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.27 3.12-2.53.98-1.45 1.39-2.85 1.41-2.92-.03-.01-2.7-1.04-2.73-4.11zM14.68 5.09c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44z" />
      </svg>
    ),
  },
};

export default function OAuthButtons() {
  const { isLoaded, signIn } = useSignIn();

  const providers = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((p): p is OAuthProvider => p in META);

  if (!providers.length) return null;

  const start = (p: OAuthProvider) => {
    if (!isLoaded) return;
    void signIn.authenticateWithRedirect({
      strategy: CLERK_STRATEGY[p],
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/home",
    });
  };

  return (
    <div className="mb-3">
      <div className="flex flex-col gap-2.5">
        {providers.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => start(p)}
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-[4px] border border-[#e1e3e4] bg-white text-[14px] font-medium text-[#111111] transition-colors hover:bg-[#fafafa]"
          >
            {META[p].icon}
            Continue with {META[p].label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#e4e4e2]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#9a9a9a]">
          or
        </span>
        <span className="h-px flex-1 bg-[#e4e4e2]" />
      </div>
    </div>
  );
}
