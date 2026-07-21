import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MfaManager, { type TotpFactor } from "./MfaManager";

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
    <main className="mx-auto w-full max-w-[640px] flex-1 px-6 py-16 sm:px-10">
      <nav className="mb-10">
        <Link
          href="/account"
          className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
        >
          ← Account
        </Link>
      </nav>

      <p className="kicker mb-4">Security</p>
      <h1 className="text-3xl font-semibold tracking-[-0.015em] text-ink">
        Two-factor authentication
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-ink-secondary">
        Protect your account with a time-based code from an authenticator app.
      </p>

      <MfaManager factors={factors} />
    </main>
  );
}
