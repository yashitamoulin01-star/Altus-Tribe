import Link from "next/link";
import { getCampusResources } from "@/lib/campus";
import CampusBrowser from "./CampusBrowser";

export const metadata = { title: "Campus — Altus Tribe" };
export const dynamic = "force-dynamic";

const SOCIALS = ["YouTube", "Facebook", "Instagram", "LinkedIn", "X"];

export default async function CampusPage() {
  const resources = await getCampusResources();

  return (
    <main className="mx-auto w-full max-w-[1080px] px-6 pt-8 pb-24 sm:px-10">
      <header className="pb-6">
        <p className="kicker mb-4">Campus</p>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
          Keep sharpening.
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg leading-snug text-ink-secondary">
          Manan&apos;s library, member wins, and the playbooks that keep the Tribe
          productive. Save what matters and track what you&apos;ve finished.
        </p>
      </header>

      <CampusBrowser resources={resources} />

      {/* PS Orientation + channels (static entry points) */}
      <section className="mt-12 grid gap-5 border-t border-hairline pt-10 md:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-surface p-6">
          <p className="kicker mb-2">Invite to PS Orientation</p>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            Know someone who belongs in the Productivity School? Invite them to the
            next orientation.
          </p>
          <a href="#" className="mt-4 inline-block rounded-lg bg-red px-5 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-red-hover">
            Send an invite →
          </a>
        </div>
        <div className="rounded-xl border border-hairline bg-surface p-6">
          <p className="kicker mb-2">Community channels</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {SOCIALS.map((s) => (
              <a key={s} href="#" className="rounded-lg border border-hairline px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted">
                {s}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-hairline py-10">
        <Link href="/home" className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink">
          ← Back to Tribe
        </Link>
      </div>
    </main>
  );
}
