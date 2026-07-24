import Link from "next/link";

// Referral Rounds — every Wednesday 10:00–11:00 AM (IST), currently FREE.
// Server component: the next occurrence is computed at request time (Home is
// dynamic), so there's no client date / hydration mismatch. Designed so a future
// Free→Paid state can slot in without a redesign.
function nextWednesdayIST(): { date: string; countdown: string } {
  const now = new Date();
  // Current wall-clock in IST (approx via locale conversion).
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  let diff = (3 - ist.getDay() + 7) % 7; // 3 = Wednesday
  if (diff === 0 && ist.getHours() >= 11) diff = 7; // window passed → next week
  const target = new Date(ist);
  target.setDate(ist.getDate() + diff);
  const d0 = new Date(ist); d0.setHours(0, 0, 0, 0);
  const t0 = new Date(target); t0.setHours(0, 0, 0, 0);
  const days = Math.round((t0.getTime() - d0.getTime()) / 86_400_000);
  return {
    date: target.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }),
    countdown: days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days to go`,
  };
}

export default function ReferralRoundCard() {
  const { date, countdown } = nextWednesdayIST();

  return (
    <section className="eco-card flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile shrink-0" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </span>
          <div>
            <p className="t-label text-ink-muted">Networking</p>
            <h3 className="t-section text-ink">Referral Rounds</h3>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">Free</span>
      </div>

      <div className="mt-4 rounded-xl border border-hairline bg-surface-sunk/60 p-4">
        <p className="t-caption">Next session</p>
        <p className="mt-0.5 text-[15px] font-semibold text-ink">{date}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[13px] font-medium text-red">10:00 AM – 11:00 AM</span>
          <span className="text-[12px] text-ink-muted">· {countdown}</span>
        </div>
      </div>

      <p className="mt-3 text-[13px] leading-snug text-ink-muted">
        A weekly, structured hour to give and receive quality referrals inside the Tribe.
      </p>

      <div className="mt-auto pt-4">
        <Link
          href="/refer"
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-red px-4 text-[13px] font-medium text-white transition-colors hover:bg-red-hover"
        >
          View details
        </Link>
      </div>
    </section>
  );
}
