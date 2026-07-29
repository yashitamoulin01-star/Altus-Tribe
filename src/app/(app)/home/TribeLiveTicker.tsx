"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// Tribe Live — signature announcement ribbon. Fixed "● TRIBE LIVE" badge on the
// left, seamless marquee of real announcements (founder / event / campus /
// referral / community), pause-on-hover, click-through, dismissible-for-the-day.
// Data is passed in from the server (real announcements + referral round).
// ═══════════════════════════════════════════════════════════════════════════

export type TickerItem = {
  id: string;
  category: string;
  text: string;
  href: string;
  icon: string; // raw SVG path
  tone: string; // Tailwind text-colour class for the icon
};

function tIcon(path: string) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: path }} />
  );
}

const TODAY = () => new Date().toISOString().slice(0, 10);
const KEY = "altus-ticker-dismissed";

export default function TribeLiveTicker({ items }: { items: TickerItem[] }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(KEY) === TODAY()) setDismissed(true);
  }, []);

  if (dismissed || items.length === 0) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, TODAY());
    setDismissed(true);
  };

  const row = (copy: "a" | "b") =>
    items.map((it) => (
      <Link
        key={`${copy}-${it.id}`}
        href={it.href}
        aria-hidden={copy === "b"}
        tabIndex={copy === "b" ? -1 : undefined}
        className="mx-4 inline-flex items-center gap-1.5 text-[12px] text-ink-secondary transition-colors hover:text-red"
      >
        <span className={`inline-flex h-4 w-4 items-center justify-center ${it.tone}`}>{tIcon(it.icon)}</span>
        <span className="font-semibold text-ink">{it.category}:</span>
        <span>{it.text}</span>
        <span className="pl-4 text-ink-muted/60">•</span>
      </Link>
    ));

  return (
    <div className="group relative flex items-center overflow-hidden rounded-xl border border-hairline bg-white shadow-sm dark:bg-surface">
      {/* Fixed TRIBE LIVE badge */}
      <div className="z-10 flex shrink-0 items-center gap-1.5 border-r border-hairline bg-white px-3 py-2 dark:bg-surface">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-red">Tribe Live</span>
      </div>

      {/* Marquee */}
      <div className="relative flex-1 overflow-hidden py-2">
        <div className="flex w-max animate-tribe-ticker whitespace-nowrap group-hover:[animation-play-state:paused]">
          <div className="flex shrink-0">{row("a")}</div>
          <div className="flex shrink-0">{row("b")}</div>
        </div>
        {/* Soft edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent dark:from-surface" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-surface" />
      </div>

      {/* Dismiss for today */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcements for today"
        title="Dismiss for today"
        className="z-10 flex shrink-0 items-center border-l border-hairline bg-white px-2.5 py-2 text-ink-muted transition-colors hover:text-red dark:bg-surface"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}
