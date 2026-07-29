"use client";

import { useEffect, useState } from "react";

// Live countdown + "Add to Calendar" (.ics) for the next Referral Round.
// Pure client — no backend. Makes the page feel like a recurring live event.

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function icsStamp(d: Date) {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z"
  );
}

export default function ReferralRoundActions({
  startsAt,
  location,
  link,
}: {
  startsAt: string;
  location: string | null;
  link: string | null;
}) {
  const [left, setLeft] = useState("");

  useEffect(() => {
    const target = Date.parse(startsAt);
    if (Number.isNaN(target)) return;
    const tick = () => {
      const ms = target - Date.now();
      if (ms <= 0) {
        setLeft("Live now");
        return;
      }
      const d = Math.floor(ms / 86_400_000);
      const h = Math.floor(ms / 3_600_000) % 24;
      const m = Math.floor(ms / 60_000) % 60;
      const s = Math.floor(ms / 1000) % 60;
      setLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${pad(h)}h ${pad(m)}m ${pad(s)}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startsAt]);

  const addToCalendar = () => {
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return;
    const end = new Date(start.getTime() + 3_600_000);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Altus Tribe//Referral Rounds//EN",
      "BEGIN:VEVENT",
      `UID:${start.getTime()}@altustribe`,
      `DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(end)}`,
      "SUMMARY:Altus Tribe — Referral Round",
      location ? `LOCATION:${location}` : "",
      `DESCRIPTION:A structured hour to give and receive quality referrals inside the Tribe.${link ? `\\n${link}` : ""}`,
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:Referral Round tomorrow",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "altus-referral-round.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {left && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-red/10 px-3 py-2 text-[13px] font-semibold text-red">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red" />
          {left === "Live now" ? "Live now" : `Starts in ${left}`}
        </span>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center rounded-lg bg-red px-5 text-[14px] font-semibold text-white transition-colors hover:bg-red-hover"
        >
          Register / Join
        </a>
      )}
      <button
        type="button"
        onClick={addToCalendar}
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-hairline px-4 text-[14px] font-semibold text-ink transition-colors hover:border-red/30 hover:bg-red/5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        Add to Calendar
      </button>
    </div>
  );
}
