import { type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 renamed the "middleware" file convention to "proxy".
//
// Clerk migration — Checkpoint 1: Clerk is composed as the OUTER layer so its
// auth context is available app-wide, but it is intentionally PASSIVE here — no
// auth.protect() — so the existing Supabase session flow inside updateSession()
// keeps working and no existing behaviour/UI breaks. The Supabase gate is
// removed in a later checkpoint once auth fully moves to Clerk.
export const proxy = clerkMiddleware(async (_auth, request: NextRequest) => {
  return updateSession(request);
});

export const config = {
  // Run on all routes except static assets/images; include Clerk's auto-proxy
  // path and the API/TRPC matcher per Clerk's Next.js requirements.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
