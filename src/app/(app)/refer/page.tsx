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

      <header className="border-b border-hairline pb-10">
        <p className="kicker mb-4">Refer Someone</p>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
          The Tribe grows by hand.
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg leading-snug text-ink-secondary">
          Every member here was invited by someone. If you know a productive
          person who belongs in the room, send them in.
        </p>
      </header>

      <section className="py-10">
        <p className="kicker mb-4">Send an invite</p>
        <ReferInvite />
        <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ink-muted">
          They&apos;ll land on the join page. Membership stays curated —
          applications are reviewed before anyone gets in.
        </p>
      </section>
    </main>
  );
}
