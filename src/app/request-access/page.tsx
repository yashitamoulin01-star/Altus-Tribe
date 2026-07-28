import Link from "next/link";
import RequestAccessForm from "./RequestAccessForm";

export const metadata = {
  title: "Request access — Altus Tribe",
  description: "Altus Tribe is a closed community for Altus Conclave participants.",
};

// Public landing → Request Access. Closed membership: only Conclave participants
// on the allowlist can proceed, and the flow never reveals whether a given email
// is on the list (anti-enumeration).
export default function RequestAccessPage() {
  return (
    <main className="relative min-h-screen bg-paper">
      {/* subtle red wash — different shades of red only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ background: "radial-gradient(60rem 40rem at 80% -10%, var(--color-red), transparent 60%)" }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-[560px] flex-col justify-center px-6 py-16">
        <div className="mb-8">
          <div className="mb-6 inline-flex items-center gap-2">
            <span className="text-[18px] font-bold tracking-[-0.02em] text-ink">ALTUS</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-red">Tribe</span>
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[34px]">
            Request access to the Tribe
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
            Altus Tribe is a private community for Altus Conclave participants. Enter the
            email you registered with and we&apos;ll send you a secure sign-in link.
          </p>
        </div>

        <RequestAccessForm />

        <p className="mt-8 text-[13px] text-ink-muted">
          Already a member?{" "}
          <Link href="/login" className="font-semibold text-red underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
