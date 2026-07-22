import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";

// Server-side Supabase client (Server Components, Route Handlers, Server Actions).
// Auth is now provided by Clerk: the accessToken callback hands Supabase the
// Clerk session JWT, so Postgres RLS runs as the Clerk user (via the
// Supabase third-party-auth integration; policies read auth.jwt()->>'sub').
// Returns null when env is not configured — callers fall back to sample data.
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    accessToken: async () => (await auth()).getToken(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called during a Server Component render — safe to ignore.
        }
      },
    },
  });
}
