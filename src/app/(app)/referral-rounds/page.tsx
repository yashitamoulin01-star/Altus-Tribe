import Link from "next/link";
import { getUpcomingEvents, getNextReferralRound } from "@/lib/events";

export const metadata = { title: "Referral Rounds — Altus Tribe" };
export const dynamic = "force-dynamic";

function fmt(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function ReferralRoundsPage() {
  const [next, upcoming] = await Promise.all([getNextReferralRound(), getUpcomingEvents(30)]);
  const rounds = upcoming.filter((e) => e.kind === "referral_round" && e.published);
  const rest = rounds.filter((e) => e.id !== next.id);

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 pt-8 pb-24 sm:px-10">
      <header className="pb-6">
        <p className="kicker mb-3">Tribe</p>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink">Referral Rounds</h1>
        <p className="mt-4 max-w-[52ch] text-lg leading-snug text-ink-secondary">
          Every Wednesday, 10:00–11:00 AM — a structured hour to give and receive
          quality referrals inside the Tribe. Free for all participants.
        </p>
      </header>

      {/* Next session */}
      <section className="rounded-2xl border border-red/30 bg-red/5 p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red">Next session</p>
        <p className="mt-1 text-[20px] font-bold text-ink">{fmt(next.startsAt)}</p>
        {next.location && <p className="mt-0.5 text-[14px] text-ink-secondary">{next.location}</p>}
        {next.description && <p className="mt-3 text-[14px] leading-relaxed text-ink-secondary">{next.description}</p>}
        {next.link && (
          <a href={next.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-11 items-center rounded-xl bg-red px-5 text-[14px] font-semibold text-white transition-colors hover:bg-red-hover">
            Register / Join
          </a>
        )}
      </section>

      {/* Upcoming */}
      {rest.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">Upcoming rounds</h2>
          <ul className="divide-y divide-hairline rounded-xl border border-hairline">
            {rest.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-[14px] text-ink">{fmt(e.startsAt)}</span>
                {e.location && <span className="shrink-0 text-[12px] text-ink-muted">{e.location}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 border-t border-hairline pt-6">
        <Link href="/home" className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
