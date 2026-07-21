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
    return NextResponse.redirect(loginUrl);
  }

  // Invitation-only gate: a signed-in member still awaiting admin approval is
  // held out of the worlds and parked on /pending. Only query for protected
  // routes so public/auth pages stay a single round-trip.
  if (user && isProtected(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.status === "pending") {
      const pendingUrl = request.nextUrl.clone();
      pendingUrl.pathname = "/pending";
      pendingUrl.search = "";
      return NextResponse.redirect(pendingUrl);
    }

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
        return NextResponse.redirect(mfaUrl);
      }
    } catch {
      // ignore — do not block navigation on MFA lookup failure
    }
  }

  return response;
}
