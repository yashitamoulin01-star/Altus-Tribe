import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MfaChallenge from "./MfaChallenge";

export const metadata = { title: "Two-factor — Altus Tribe" };

// Login-time MFA challenge. Reached when a signed-in user with a verified
// authenticator is still at aal1 and needs to elevate to aal2. Users without MFA
// (nextLevel === currentLevel) are sent straight home.
export default async function MfaPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aal || aal.nextLevel !== "aal2" || aal.currentLevel === "aal2") {
    redirect("/home");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col items-center justify-center px-6 text-center">
      <p className="kicker mb-4">Two-factor</p>
      <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink md:text-4xl">
        Enter your code.
      </h1>
      <p className="mt-4 mb-8 text-[16px] leading-relaxed text-ink-secondary">
        Open your authenticator app and enter the current 6-digit code to finish
        signing in.
      </p>
      <MfaChallenge />
    </main>
  );
}
