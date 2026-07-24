import { signInWithProvider } from "./actions";
import OAuthButton from "./OAuthButton";

// Compact quick-sign-in row for the (frozen) login card: three small boxes
// sitting cleanly together — Google · Apple · PS App — instead of giant
// full-width OAuth buttons.
//
// Google + Apple are REAL: each posts to the signInWithProvider server action
// (Supabase PKCE OAuth). If the provider isn't enabled in the Supabase Dashboard
// yet, Supabase returns an error and the action redirects back to
// /login?error=oauth ("Social sign-in didn't complete") — an honest failure, no
// fake success. Owner must enable Google/Apple providers in Supabase to complete.
//
// PS App is intentionally PREPARED-BUT-DISABLED: Altus Tribe is part of the
// Productivity Shastra ecosystem, but no PS SSO endpoint / verified-identity
// contract exists yet (see the PS integration audit). Rather than fake a login,
// the entry point is visible and honestly marked "soon" until PS exposes an
// OIDC/OAuth (or signed-JWT) identity we can verify server-side.

const GOOGLE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 01-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.09A12 12 0 0012 24z" />
    <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 010-4.56V6.63H1.26a12 12 0 000 10.74l4.01-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0012 0 12 12 0 001.26 6.63l4.01 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

const APPLE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000" aria-hidden>
    <path d="M17.05 12.7c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.15-.46 7.8 1.3 10.35.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.27 3.12-2.53.98-1.45 1.39-2.85 1.41-2.92-.03-.01-2.7-1.04-2.73-4.11zM14.68 5.09c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44z" />
  </svg>
);

// PS monogram — Altus-neutral (currentColor), inherits the muted disabled tone.
const PS_ICON = (
  <span
    aria-hidden
    className="grid h-4 w-4 place-items-center rounded-[3px] border border-current text-[8px] font-bold leading-none tracking-tighter"
  >
    PS
  </span>
);

export default function OAuthButtons() {
  return (
    <div className="mb-3">
      <div className="grid grid-cols-3 gap-2">
        <form action={signInWithProvider}>
          <input type="hidden" name="provider" value="google" />
          <OAuthButton label="Google" ariaLabel="Continue with Google" icon={GOOGLE_ICON} />
        </form>

        <form action={signInWithProvider}>
          <input type="hidden" name="provider" value="apple" />
          <OAuthButton label="Apple" ariaLabel="Continue with Apple" icon={APPLE_ICON} />
        </form>

        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-label="Continue with Productivity Shastra — coming soon"
          title="Productivity Shastra sign-in — coming soon"
          className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-[4px] border border-dashed border-[#d9dbdc] bg-[#fbfbfb] text-[13px] font-medium text-[#9a9a9a]"
        >
          {PS_ICON}
          <span className="truncate">PS App</span>
        </button>
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
