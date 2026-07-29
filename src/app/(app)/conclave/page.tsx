import Link from "next/link";
import { getUpcomingEvents } from "@/lib/events";

export const metadata = { title: "Altus Conclave — Altus Tribe" };
export const dynamic = "force-dynamic";

function fmt(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function fmtDay(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ConclavePage() {
  const upcoming = await getUpcomingEvents(30);
  const conclaves = upcoming.filter((e) => (e.kind === "conclave" || e.kind === "event") && e.published);
  const next = conclaves[0];
  const rest = conclaves.slice(1);

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 pt-6 pb-16 sm:px-10">
      <header className="pb-6">
        <p className="kicker mb-3">Events</p>
        <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink">Altus Conclave</h1>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-snug text-ink-secondary">
          The flagship gatherings of the Tribe — in-person and online. Register for
          the next Conclave and see what&apos;s coming up.
        </p>
      </header>

      {next ? (
        <section className="rounded-xl border border-red/30 bg-red/5 p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red">Next conclave</p>
          <p className="mt-1 text-[22px] font-bold text-ink">{next.title}</p>
          <p className="mt-1 text-[15px] font-semibold text-ink">{fmt(next.startsAt)}</p>
          {next.location && <p className="mt-0.5 text-[14px] text-ink-secondary">{next.location}</p>}
          {next.description && <p className="mt-3 text-[14px] leading-relaxed text-ink-secondary">{next.description}</p>}
          {next.link && (
            <a href={next.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-11 items-center rounded-lg bg-red px-5 text-[14px] font-semibold text-white transition-colors hover:bg-red-hover">
              Register / Details
            </a>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-hairline bg-surface-sunk/40 p-6">
          <p className="text-[15px] font-semibold text-ink">No upcoming Conclave scheduled</p>
          <p className="mt-1 text-[14px] text-ink-secondary">When the team schedules the next one, it&apos;ll appear here.</p>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">More events</h2>
          <ul className="divide-y divide-hairline rounded-xl border border-hairline">
            {rest.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium text-ink">{e.title}</span>
                  <span className="block text-[12px] text-ink-muted">{fmtDay(e.startsAt)}{e.location ? ` · ${e.location}` : ""}</span>
                </span>
                {e.link && (
                  <a href={e.link} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[12px] font-semibold text-red hover:text-red-hover">
                    Details →
                  </a>
                )}
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
