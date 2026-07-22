import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client (Client Components: realtime, presence). Auth is
// provided by Clerk — the accessToken callback returns the current Clerk session
// JWT so RLS runs as the Clerk user. Returns null when env is unconfigured so the
// app can fall back to bundled sample data.
type ClerkWindow = Window & {
  Clerk?: { session?: { getToken: () => Promise<string | null> } };
};

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key, {
    accessToken: async () => {
      if (typeof window === "undefined") return null;
      const clerk = (window as ClerkWindow).Clerk;
      return (await clerk?.session?.getToken()) ?? null;
    },
  });
}
