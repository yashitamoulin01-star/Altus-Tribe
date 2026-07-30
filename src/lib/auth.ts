import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

// Returns the signed-in user, or null (also null when Supabase is unconfigured).
//
// Request-scoped cache: several server components + data helpers call getUser()
// during a single render, and each call is otherwise a fresh Supabase Auth
// network round-trip. cache() dedupes them to ONE validation per request, which
// is a real latency win on pages that read the user from multiple widgets.
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Whether Supabase auth is wired up in this environment.
export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
