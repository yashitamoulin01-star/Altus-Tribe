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
    <main className="mx-auto w-full max-w-[900px] flex-1 px-6 pt-6 pb-16 sm:px-10">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface px-4 py-2 text-[13px] font-semibold text-ink shadow-sm transition-colors hover:border-hairline-bright"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back
      </Link>

      <header className="mt-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-3xl">
          Security
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">
          Two-factor authentication, active sessions, and account controls.
        </p>
      </header>

      <MfaManager factors={factors} />
      <AccountControls />
    </main>
  );
}
