"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

// UI-2 app shell nav. Desktop = clean light top header (logo · primary nav ·
// search · theme/notifications/profile), inspired by the Productivity Shastra
// ecosystem header. Mobile = touch-friendly bottom nav. Target IA:
// Home · Tribe · Sacred Space · Campus · Profile. Routes are unchanged — "Tribe"
// opens the participant directory (/explore, "Connect with Participants").

type Item = { href: string; label: string; match: string[] };

const NAV: Item[] = [
  { href: "/home", label: "Home", match: ["/home"] },
  { href: "/explore", label: "Tribe", match: ["/explore", "/connections", "/messages", "/m/"] },
  { href: "/sacred-space", label: "Sacred Space", match: ["/sacred-space"] },
  { href: "/campus", label: "Campus", match: ["/campus"] },
  { href: "/account", label: "Profile", match: ["/account", "/settings", "/notifications"] },
];

function isActive(pathname: string, match: string[]) {
  return match.some((m) =>
    m.endsWith("/") ? pathname.startsWith(m) : pathname === m || pathname.startsWith(`${m}/`),
  );
}

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Icon({ href, size = 20 }: { href: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true, ...S } as const;
  switch (href) {
    case "/home":
      return (<svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>);
    case "/explore": // Tribe / people
      return (<svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" /><path d="M16.5 5.2a3 3 0 0 1 0 5.6M18 20c0-2.2-.8-3.9-2-5" /></svg>);
    case "/sacred-space":
      return (<svg {...p}><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 21l1.9-5.6a8.5 8.5 0 0 1-.9-3.9A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z" /></svg>);
    case "/campus":
      return (<svg {...p}><path d="M3 8 12 4l9 4-9 4-9-4Z" /><path d="M7 10.5V15c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-4.5" /></svg>);
    default: // profile
      return (<svg {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></svg>);
  }
}

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    router.push(t ? `/explore?q=${encodeURIComponent(t)}` : "/explore");
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    const r = document.documentElement;
    if (next) {
      r.classList.add("dark");
      r.setAttribute("data-theme", "dark");
      localStorage.setItem("altus-theme", "dark");
    } else {
      r.classList.remove("dark");
      r.removeAttribute("data-theme");
      localStorage.setItem("altus-theme", "light");
    }
  };

  return (
    <>
      {/* ── Desktop top header ── */}
      <header className="fixed inset-x-0 top-0 z-40 hidden h-14 border-b border-hairline bg-paper/95 backdrop-blur lg:block">
        <div className="mx-auto flex h-full max-w-[1200px] items-center gap-4 px-6">
          <Link href="/home" className="flex shrink-0 items-center gap-2 no-underline">
            <span className="h-2 w-2 rounded-full bg-red" />
            <span className="font-mono text-[13px] font-bold uppercase tracking-[0.18em] text-ink">Altus Tribe</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map((d) => {
              const on = isActive(pathname, d.match);
              return (
                <Link
                  key={d.href}
                  href={d.href}
                  className={`flex items-center gap-2 rounded-[10px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    on ? "bg-red-muted text-red" : "text-ink-secondary hover:bg-surface-hover hover:text-ink"
                  }`}
                >
                  <Icon href={d.href} size={18} />
                  {d.label}
                </Link>
              );
            })}
          </nav>

          <form onSubmit={search} className="ml-auto w-full max-w-[300px]">
            <label className="sr-only" htmlFor="global-search">Search participants</label>
            <input
              id="global-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Participants, Groups & Resources"
              className="h-9 w-full rounded-[10px] border border-hairline bg-surface-sunk px-3.5 text-[13px] text-ink placeholder:text-ink-muted focus:border-red/50 focus:outline-none focus:ring-2 focus:ring-red/15"
            />
          </form>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="grid h-9 w-9 place-items-center rounded-[10px] text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
            >
              {dark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
              )}
            </button>
            <Link href="/notifications" aria-label="Notifications" className="grid h-9 w-9 place-items-center rounded-[10px] text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink">
              <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            </Link>
            <Link href="/account" aria-label="Your profile" className="grid h-9 w-9 place-items-center rounded-full border border-hairline text-ink-secondary transition-colors hover:border-hairline-bright hover:text-ink">
              <Icon href="/account" size={18} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hairline bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map((d) => {
          const on = isActive(pathname, d.match);
          return (
            <Link
              key={d.href}
              href={d.href}
              aria-label={d.label}
              className={`flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                on ? "text-red" : "text-ink-muted"
              }`}
            >
              <Icon href={d.href} size={22} />
              <span className="max-w-full truncate px-0.5">{d.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
