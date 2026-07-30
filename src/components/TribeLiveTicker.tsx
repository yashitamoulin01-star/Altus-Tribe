"use client";

import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════
// Tribe Live — announcement ribbon attached under the top nav. Always visible
// (not dismissible), sticks below the header on scroll, seamless marquee of real
// announcements. Data is passed in from the app layout (server).
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

export default function TribeLiveTicker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null;

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
    <div className="group fixed inset-x-0 top-16 z-40 flex h-9 items-center overflow-hidden border-b border-hairline bg-white sm:top-20 dark:bg-surface">
      {/* Fixed TRIBE LIVE badge */}
      <div className="z-10 flex h-full shrink-0 items-center gap-1.5 border-r border-hairline bg-white px-3 dark:bg-surface">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-red">Tribe Live</span>
      </div>

      {/* Marquee */}
      <div className="relative flex h-full flex-1 items-center overflow-hidden">
        <div className="flex w-max animate-tribe-ticker whitespace-nowrap group-hover:[animation-play-state:paused]">
          <div className="flex shrink-0">{row("a")}</div>
          <div className="flex shrink-0">{row("b")}</div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent dark:from-surface" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-surface" />
      </div>
    </div>
  );
}
