import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Next 16 renamed the "middleware" file convention to "proxy".
//
// Clerk migration — Checkpoint 2: the protected-route gate now runs on the CLERK
// session (was Supabase). A signed-in Clerk user reaches the app and the session
// persists across refresh. The Supabase pending/approval + MFA gates are
// reinstated against the Clerk→profile mapping in Checkpoint 4 (needs user sync).
const isProtected = createRouteMatcher([
  "/home(.*)",
  "/explore(.*)",
  "/campus(.*)",
  "/sacred-space(.*)",
  "/account(.*)",
  "/onboarding(.*)",
  "/messages(.*)",
  "/notifications(.*)",
  "/settings(.*)",
  "/admin(.*)",
  "/mfa(.*)",
  "/pending(.*)",
]);

export const proxy = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  if (!userId && isProtected(request)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "redirect",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
