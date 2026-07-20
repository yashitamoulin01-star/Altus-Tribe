"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The app's primary chrome. Bottom nav on mobile (frozen design system §5);
// a slim top bar at >=1024px. Four calm destinations — Tribe is the home world,
// so it owns the Home cover and Explore lives under it.
type Dest = {
  href: string;
  label: string;
  // prefixes that keep this destination "active"
  match: string[];
  icon: (active: boolean) => React.ReactNode;
};

const stroke = (active: boolean) => (active ? "var(--color-ink)" : "var(--color-ink-muted)");

const DESTINATIONS: Dest[] = [
  {
    href: "/home",
    label: "Tribe",
    match: ["/home", "/explore", "/m/"],
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    href: "/sacred-space",
    label: "Sacred Space",
    match: ["/sacred-space"],
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3 4 7v6c0 4.5 3.5 7 8 8 4.5-1 8-3.5 8-8V7l-8-4Z" />
      </svg>
    ),
  },
  {
    href: "/campus",
    label: "Campus",
    match: ["/campus"],
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 8 12 4l9 4-9 4-9-4Z" />
        <path d="M7 10.5V15c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-4.5" />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "You",
    match: ["/account"],
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
      </svg>
    ),
  },
];

function isActive(pathname: string, match: string[]) {
  return match.some((m) =>
    m.endsWith("/") ? pathname.startsWith(m) : pathname === m || pathname.startsWith(`${m}/`),
  );
}

export default function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: slim top bar (>=1024px) */}
      <header className="fixed inset-x-0 top-0 z-40 hidden border-b border-hairline bg-paper/90 backdrop-blur lg:block">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-6 sm:px-10">
          <Link href="/home" className="flex items-center gap-1.5 no-underline">
            <img
              src="/logo-dark.png"
              alt="Altus Corp"
              style={{ height: '22px', width: 'auto', display: 'block' }}
            />
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-ink">
              Tribe
            </span>
          </Link>
          <nav className="flex items-center gap-8">
            {DESTINATIONS.map((d) => {
              const active = isActive(pathname, d.match);
              return (
                <Link
                  key={d.href}
                  href={d.href}
                  className="relative py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors"
                  style={{ color: active ? "var(--color-ink)" : "var(--color-ink-muted)" }}
                >
                  {d.label}
                  {active && (
                    <span className="absolute -bottom-[13px] left-0 h-[2px] w-full bg-red" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile: bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-paper/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <ul className="mx-auto flex max-w-[560px] items-stretch">
          {DESTINATIONS.map((d) => {
            const active = isActive(pathname, d.match);
            return (
              <li key={d.href} className="flex-1">
                <Link
                  href={d.href}
                  className="relative flex h-14 flex-col items-center justify-center gap-1"
                  aria-current={active ? "page" : undefined}
                >
                  {active && <span className="absolute top-0 h-[2px] w-8 bg-red" />}
                  {d.icon(active)}
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.08em]"
                    style={{ color: active ? "var(--color-ink)" : "var(--color-ink-muted)" }}
                  >
                    {d.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
