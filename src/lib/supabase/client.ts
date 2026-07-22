import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client (Client Components). Uses the public anon key;
// RLS enforces access. Returns null when env is not configured so the app can
// fall back to bundled sample data during local/offline development.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
