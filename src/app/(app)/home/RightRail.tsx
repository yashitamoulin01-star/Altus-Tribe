import Link from "next/link";
import { getAnnouncements } from "@/lib/community";
import { getNextReferralRound } from "@/lib/events";
import { getSuggestedMembers } from "@/lib/dashboard";
import { initials } from "./widgets/_shared";

function fmt(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function RightRail() {
  const [announcements, rr, people] = await Promise.all([
    getAnnouncements(),
    getNextReferralRound(),
    getSuggestedMembers(3),
  ]);
  const top = announcements.slice(0, 3);
  const rrDate = new Date(rr.startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Announcements */}
      <section className="rounded-2xl border border-hairline bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-ink">Announcements from Manan Vasa</h3>
          <Link href="/sacred-space" className="shrink-0 text-[12px] font-semibold text-red">See all →</Link>
        </div>
        {top.length === 0 ? (
          <p className="text-[13px] text-ink-muted">No announcements yet.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {top.map((a) => (
              <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                {a.pinnedAt && <span className="mb-1 inline-block rounded bg-red/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-red">Pinned</span>}
                <p className="text-[14px] font-bold text-ink">{a.title}</p>
                {a.body && <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-ink-secondary">{a.body}</p>}
                <p className="mt-1 text-[11px] text-ink-muted">{fmt(a.publishedAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Next Referral Round */}
      <section className="rounded-2xl border border-hairline bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red/10 text-red">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">Next Referral Round</p>
            <p className="mt-0.5 text-[15px] font-bold text-ink">{rrDate}</p>
            <p className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-secondary">
              10:00 AM – 11:00 AM
              <span className="rounded bg-red/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red">Free</span>
            </p>
          </div>
        </div>
        <Link href="/referral-rounds" className="mt-3 block rounded-lg border border-red/30 bg-red/5 px-3 py-2 text-center text-[12px] font-semibold text-red transition-colors hover:bg-red/10">View Details →</Link>
      </section>

      {/* People you may benefit from meeting */}
      {people.length > 0 && (
        <section className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-ink">People you may benefit from meeting</h3>
            <Link href="/explore" className="shrink-0 text-[12px] font-semibold text-red">See all →</Link>
          </div>
          <ul className="space-y-3">
            {people.map((p) => (
              <li key={p.slug} className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-hairline bg-surface-sunk">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt={p.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-mono text-[12px] text-ink-muted">{initials(p.fullName)}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink">{p.fullName}</p>
                  <p className="truncate text-[11px] text-ink-muted">{[p.businessName, p.category].filter(Boolean).join(" · ")}</p>
                </div>
                <Link href={`/m/${p.slug}`} className="shrink-0 rounded-lg border border-hairline px-3 py-1.5 text-[11px] font-semibold text-ink transition-colors hover:border-hairline-bright">View Profile</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
