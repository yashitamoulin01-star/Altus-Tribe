import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Server-side Supabase client (Server Components, Route Handlers, Server Actions).
// Reads/writes the auth cookie so RLS runs as the signed-in user. Returns null
// when env is not configured — callers fall back to bundled sample data.
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
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
          // called from a Server Component render — safe to ignore; the
          // middleware/session refresh path handles cookie writes.
        }
      },
    },
  });
}
