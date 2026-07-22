import "server-only";
import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

// Session identity comes from Clerk; the app's canonical id stays the uuid
// profiles.id (resolved via profiles.clerk_id). getUser() returns that profile,
// or null when signed out. Request-cached so repeated calls hit the DB once.
export interface SessionUser {
  id: string; // profiles.id (uuid)
  clerkId: string;
  email: string | null;
}

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = await createClient();
  if (!supabase) {
    // Offline/unconfigured: no profile row to resolve; expose the Clerk id only.
    return { id: userId, clerkId: userId, email: null };
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, work_email, personal_email")
    .eq("clerk_id", userId)
    .maybeSingle();

  // Before the sync webhook creates the profile, fall back to the Clerk id so
  // callers don't treat an authenticated user as signed out.
  return {
    id: (data?.id as string) ?? userId,
    clerkId: userId,
    email: (data?.work_email as string) ?? (data?.personal_email as string) ?? null,
  };
});

// Convenience for server actions that only need the caller's profile id.
export async function getCurrentProfileId(): Promise<string | null> {
  return (await getUser())?.id ?? null;
}

// Whether auth is wired up in this environment (Clerk publishable key present).
export function isAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}
