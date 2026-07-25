"use client";

import Link from "next/link";
import { useState } from "react";

// Dismissible "Referral Round is coming up" banner. Dismissal is remembered per
// session (the specific round's start time) so it doesn't nag after you close it.
export default function ReminderBanner({
  startsAt,
  live,
}: {
  startsAt: string;
  live: boolean;
}) {
  const key = `altus-rr-dismissed-${startsAt}`;
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(key) === "1",
  );
  if (dismissed) return null;

  const when = new Date(startsAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-red/30 bg-red/5 px-4 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red text-white">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      </span>
      <p className="min-w-0 flex-1 text-[13px] text-ink">
        <span className="font-semibold">
          {live ? "Referral Round is happening now" : `Referral Round ${when}, 10:00–11:00 AM`}
        </span>
        <span className="text-ink-muted"> — a weekly hour to give &amp; receive quality referrals.</span>
      </p>
      <Link href="/referral-rounds" className="shrink-0 rounded-lg bg-red px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-red-hover">
        {live ? "Join" : "Details"}
      </Link>
      <button
        type="button"
        onClick={() => { sessionStorage.setItem(key, "1"); setDismissed(true); }}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-ink-muted transition-colors hover:text-ink"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}
