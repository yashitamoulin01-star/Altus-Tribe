import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that require an authenticated session — the member "worlds". The
// splash, public member features (/m/*), and the auth screens stay open.
const PROTECTED_PREFIXES = [
  "/home",
  "/explore",
  "/campus",
  "/sacred-space",
  "/account",
  "/onboarding",
  "/messages",
  "/notifications",
  "/settings",
  "/admin", // role additionally enforced in the /admin layout
];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// Refreshes the Supabase auth session on every request and gates protected
// routes. No-ops gracefully when Supabase env is not configured so the offline
// sample-data demo keeps working.
// Build a redirect that carries over any auth cookies the session refresh just
// wrote onto `response`. Without this, a token refreshed during getUser() is lost
// on the redirect branches and the user is silently logged out on the next hop.
function redirectWithCookies(from: NextResponse, url: URL): NextResponse {
  const res = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) res.cookies.set(cookie);
  return res;
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token; do not run code between
  // createServerClient and getUser or sessions may randomly log out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && isProtected(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return redirectWithCookies(response, loginUrl);
  }

  // Signed-in gates for the member worlds.
  if (user && isProtected(pathname)) {
    // NOTE: the invitation-only "awaiting approval" (pending) gate is PAUSED per
    // product decision — new users go straight into the app. The DB trigger also
    // creates new members as `active`. To re-enable, restore the block below and
    // flip the trigger back to `pending`.
    // const { data: profile } = await supabase
    //   .from("profiles").select("status").eq("id", user.id).maybeSingle();
    // if (profile?.status === "pending") {
    //   const pendingUrl = request.nextUrl.clone();
    //   pendingUrl.pathname = "/pending"; pendingUrl.search = "";
    //   return redirectWithCookies(response, pendingUrl);
    // }

    // MFA gate: a user who enrolled an authenticator but is still at aal1 must
    // elevate before entering the worlds. Only affects MFA-enrolled users
    // (nextLevel === 'aal2'); everyone else passes untouched. Fail open on any
    // error so an AAL hiccup never locks the app.
    try {
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === "aal2" && aal.currentLevel === "aal1") {
        const mfaUrl = request.nextUrl.clone();
        mfaUrl.pathname = "/mfa";
        mfaUrl.search = "";
        return redirectWithCookies(response, mfaUrl);
      }
    } catch {
      // ignore — do not block navigation on MFA lookup failure
    }
  }

  return response;
}
