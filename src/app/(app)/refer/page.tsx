import Link from "next/link";
import ReferInvite from "./ReferInvite";

export const metadata = { title: "Refer Someone — Altus Tribe" };

export default function ReferPage() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-6 pt-8 sm:px-10">
      <nav className="mb-8">
        <Link
          href="/account"
          className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
        >
          ← You
        </Link>
      </nav>

      <header className="border-b border-hairline pb-6">
        <p className="kicker mb-3">Refer Someone</p>
        <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink md:text-3xl">
          Share Productivity Shastra.
        </h1>
        <p className="mt-3 max-w-[46ch] text-[15px] leading-snug text-ink-secondary">
          The Tribe itself is invitation-only — but anyone can start with
          Productivity Shastra. Know someone who&apos;d get more done? Send them in.
        </p>
      </header>

      <section className="py-10">
        <p className="kicker mb-3">Send an invite</p>
        <ReferInvite />
        <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ink-muted">
          They&apos;ll land on the Productivity Shastra app and can get started right away.
        </p>
      </section>
    </main>
  );
}
