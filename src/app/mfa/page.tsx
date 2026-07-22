import { redirect } from "next/navigation";

export const metadata = { title: "Two-factor — Altus Tribe" };

// MFA is now handled by Clerk inline during sign-in (Clerk challenges for a
// second factor before creating the session), so this standalone Supabase-MFA
// page is no longer part of the flow. Kept as a safe redirect.
export default async function MfaPage() {
  redirect("/home");
}
