"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Referral Rounds card — counts down to the next round (admin-scheduled if set,
// else the standing Wednesday 10–11 AM). Shows a reminder highlight when it's
// within 24h. `startsAt` comes from the server (getNextReferralRound).
export default function ReferralRoundCard({
  startsAt,
  title = "Referral Round",
  location,
  link,
}: {
  startsAt: string;
  title?: string;
  location?: string | null;
  link?: string | null;
}) {
  const [t, setT] = useState({ d: "--", h: "--", m: "--", s: "--", soon: false, live: false });

  useEffect(() => {
    const target = new Date(startsAt).getTime();
    const calc = () => {
      const ms = target - Date.now();
      if (ms <= 0) {
        setT({ d: "00", h: "00", m: "00", s: "00", soon: true, live: true });
        return;
      }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms / 3600000) % 24);
      const m = Math.floor((ms / 60000) % 60);
      const s = Math.floor((ms / 1000) % 60);
      setT({
        d: String(d).padStart(2, "0"), h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"), s: String(s).padStart(2, "0"),
        soon: ms <= 24 * 3600000, live: false,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [startsAt]);

  const dateStr = new Date(startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  return (
    <section className={`eco-card flex flex-col p-5 sm:p-6 ${t.soon ? "border-red/50" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red/20 bg-red/10 text-red">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">Referral Rounds</p>
            <h3 className="text-[16px] font-bold text-ink sm:text-[18px]">{t.live ? "Happening now" : t.soon ? "Starting soon" : "Next session"}</h3>
          </div>
        </div>
        <span className="rounded-full border border-hairline px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">Free</span>
      </div>

      <div className="mt-4 rounded-2xl border border-hairline bg-surface-sunk/50 p-4">
        <p className="text-[17px] font-bold text-ink sm:text-[19px]">{dateStr}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-red">
          10:00 AM – 11:00 AM{location ? `  ·  ${location}` : ""}
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[{ label: "Days", val: t.d }, { label: "Hours", val: t.h }, { label: "Mins", val: t.m }, { label: "Secs", val: t.s }].map((b) => (
            <div key={b.label} className="rounded-xl border border-hairline bg-white p-2 text-center dark:bg-surface">
              <span className="block text-[18px] font-bold tabular-nums text-ink sm:text-[20px]">{b.val}</span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-ink-muted">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-1">
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="flex h-11 w-full items-center justify-center rounded-xl bg-red px-5 text-[14px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover active:scale-95">
            {t.live ? "Join now" : "Register"}
          </a>
        ) : (
          <Link href="/referral-rounds" className="flex h-11 w-full items-center justify-center rounded-xl bg-red px-5 text-[14px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover active:scale-95">
            View Details
          </Link>
        )}
      </div>
    </section>
  );
}
