import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MfaManager, { type TotpFactor } from "./MfaManager";
import AccountControls from "./AccountControls";

export const metadata = { title: "Security — Altus Tribe" };

export default async function SecurityPage() {
  const supabase = await createClient();
  let factors: TotpFactor[] = [];
  if (supabase) {
    const { data } = await supabase.auth.mfa.listFactors();
    factors = (data?.totp ?? []).map((f) => ({
      id: f.id,
      friendlyName: f.friendly_name ?? "Authenticator",
    }));
  }

  return (
    <main className="mx-auto w-full max-w-[640px] flex-1 px-6 py-8 sm:px-10">
      <nav className="mb-5">
        <Link
          href="/account"
          className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
        >
          ← Account
        </Link>
      </nav>

      <p className="kicker mb-2">Account</p>
      <h1 className="text-2xl font-semibold tracking-[-0.015em] text-ink md:text-3xl">
        Security
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">
        Two-factor authentication, active sessions, and account controls.
      </p>

      <MfaManager factors={factors} />
      <AccountControls />
    </main>
  );
}
