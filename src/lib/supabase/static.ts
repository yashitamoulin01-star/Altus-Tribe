import { createClient as createSupabase } from "@supabase/supabase-js";

// Cookieless anon client for PUBLIC, build-time-safe reads (directory, public
// member features, generateStaticParams). It never touches cookies(), so it can
// run inside generateStaticParams and during static prerender. RLS still applies
// via the anon role ("public reads public members"). Returns null when
// unconfigured so callers fall back to sample data.
export function createStaticClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createSupabase(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
