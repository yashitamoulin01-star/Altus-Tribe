"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Compact referral-round card body for the dashboard action row (matches the
// reference: date, time, inline countdown, Join Session / Add to Calendar).
// Single box — the outer card wrapper is provided by the parent.
export default function ReferralRoundMini({
  startsAt,
  location,
  link,
}: {
  startsAt: string;
  location?: string | null;
  link?: string | null;
}) {
  const [t, setT] = useState({ d: "--", h: "--", m: "--", s: "--", live: false });

  useEffect(() => {
    const target = new Date(startsAt).getTime();
    const calc = () => {
      const ms = target - Date.now();
      if (ms <= 0) { setT({ d: "00", h: "00", m: "00", s: "00", live: true }); return; }
      setT({
        d: String(Math.floor(ms / 86400000)).padStart(2, "0"),
        h: String(Math.floor((ms / 3600000) % 24)).padStart(2, "0"),
        m: String(Math.floor((ms / 60000) % 60)).padStart(2, "0"),
        s: String(Math.floor((ms / 1000) % 60)).padStart(2, "0"),
        live: false,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [startsAt]);

  const dateStr = new Date(startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex flex-1 flex-col">
      <div className="rounded-xl bg-red/[0.03] p-4 text-center">
        <p className="text-[15px] font-bold text-ink">{dateStr}</p>
        <p className="mt-0.5 text-[12px] font-semibold text-red">10:00 AM – 11:00 AM{location ? ` · ${location}` : ""}</p>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {[{ l: "DAYS", v: t.d }, { l: "HRS", v: t.h }, { l: "MINS", v: t.m }, { l: "SECS", v: t.s }].map((b) => (
            <div key={b.l} className="flex-1 rounded-lg border border-hairline bg-white py-1.5 dark:bg-surface">
              <span className="block text-[16px] font-bold tabular-nums leading-none text-ink">{b.v}</span>
              <span className="mt-0.5 block text-[9px] font-medium tracking-wider text-ink-muted">{b.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="flex h-10 items-center justify-center rounded-xl bg-red text-[13px] font-semibold text-white transition-colors hover:bg-red-hover">{t.live ? "Join now" : "Join Session"}</a>
        ) : (
          <Link href="/referral-rounds" className="flex h-10 items-center justify-center rounded-xl bg-red text-[13px] font-semibold text-white transition-colors hover:bg-red-hover">Join Session</Link>
        )}
        <Link href="/referral-rounds" className="flex h-10 items-center justify-center rounded-xl border border-hairline bg-white text-[13px] font-semibold text-ink transition-colors hover:border-hairline-bright dark:bg-surface">Add to Calendar</Link>
      </div>
    </div>
  );
}
