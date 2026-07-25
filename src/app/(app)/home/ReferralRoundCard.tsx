"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Referral Rounds — every Wednesday 10:00–11:00 AM (IST), currently FREE.
// Renders the session date, time, FREE badge, countdown timer boxes, and View Details CTA.
export default function ReferralRoundCard() {
  const [timeLeft, setTimeLeft] = useState({ days: "04", hours: "18", mins: "32", secs: "45" });

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      let diff = (3 - ist.getDay() + 7) % 7; // 3 = Wednesday
      if (diff === 0 && ist.getHours() >= 11) diff = 7;
      const target = new Date(ist);
      target.setDate(ist.getDate() + diff);
      target.setHours(10, 0, 0, 0);

      const ms = target.getTime() - ist.getTime();
      if (ms <= 0) {
        setTimeLeft({ days: "00", hours: "00", mins: "00", secs: "00" });
        return;
      }
      const d = Math.floor(ms / (1000 * 60 * 60 * 24));
      const h = Math.floor((ms / (1000 * 60 * 60)) % 24);
      const m = Math.floor((ms / (1000 * 60)) % 60);
      const s = Math.floor((ms / 1000) % 60);
      setTimeLeft({
        days: String(d).padStart(2, "0"),
        hours: String(h).padStart(2, "0"),
        mins: String(m).padStart(2, "0"),
        secs: String(s).padStart(2, "0"),
      });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="eco-card flex flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red/10 text-red border border-red/20 shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">Referral Rounds</p>
            <h3 className="text-[16px] font-bold text-ink sm:text-[18px]">Next Session</h3>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          FREE
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-hairline bg-surface-sunk/50 p-4">
        <p className="text-[17px] font-bold text-ink sm:text-[19px]">Wed, Jul 30, 2026</p>
        <p className="mt-0.5 text-[13px] font-semibold text-red">10:00 AM – 11:00 AM</p>

        {/* Countdown boxes */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Days", val: timeLeft.days },
            { label: "Hours", val: timeLeft.hours },
            { label: "Mins", val: timeLeft.mins },
            { label: "Secs", val: timeLeft.secs },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-hairline bg-white p-2 text-center shadow-xs dark:bg-surface">
              <span className="block text-[18px] font-bold tabular-nums text-ink sm:text-[20px]">{item.val}</span>
              <span className="block text-[10px] font-medium text-ink-muted uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-1">
        <Link
          href="/refer"
          className="flex h-11 w-full items-center justify-center rounded-xl bg-red px-5 text-[14px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover active:scale-95"
        >
          View Details
        </Link>
      </div>
    </section>
  );
}
