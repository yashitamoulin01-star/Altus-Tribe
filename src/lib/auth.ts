import "server-only";
import { auth } from "@clerk/nextjs/server";

// Session identity now comes from Clerk (auth migration). Returns a minimal user
// shape (id = Clerk user id, plus email when present in the session claims), or
// null when signed out. Consumers only read .id / .email.
export interface SessionUser {
  id: string;
  email: string | null;
}

export async function getUser(): Promise<SessionUser | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  const claims = sessionClaims as { email?: string } | null;
  return { id: userId, email: claims?.email ?? null };
}

// Whether auth is wired up in this environment (Clerk publishable key present).
export function isAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}
