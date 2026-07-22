"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CardNav from "./CardNav";

type Dest = {
  href: string;
  label: string;
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3 4 7v6c0 4.5 3.5 7 8 8 4.5-1 8-3.5 8-8V7l-8-4Z" />
      </svg>
    ),
  },
  {
    href: "/campus",
    label: "Campus",
    match: ["/campus"],
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 8 12 4l9 4-9 4-9-4Z" />
        <path d="M7 10.5V15c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-4.5" />
      </svg>
    ),
  },
  {
    href: "/messages",
    label: "Messages",
    match: ["/messages"],
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 21l1.9-5.6a8.5 8.5 0 0 1-.9-3.9A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "You",
    match: ["/account"],
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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

  const cardNavItems = DESTINATIONS.map((d) => ({
    href: d.href,
    label: d.label,
    icon: d.icon,
    active: isActive(pathname, d.match),
  }));

  return (
    <>
      {/* Desktop Top Header Bar (>=1024px) */}
      <header className="fixed inset-x-0 top-0 z-40 hidden border-b border-hairline/80 bg-paper/85 backdrop-blur-xl lg:block transition-all duration-300">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-6 sm:px-10">
          <Link href="/home" className="flex items-center gap-3 group no-underline">
            <div className="relative overflow-hidden rounded-lg p-0.5 border border-hairline/60 bg-surface-sunk transition-border duration-200 group-hover:border-red/50">
              <img
                src="/logo-light.png"
                alt="Altus Corp"
                style={{ height: '32px', width: 'auto', display: 'block' }}
              />
            </div>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-ink)' }}>
                ALTUS
              </span>
              <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.22em', color: 'var(--color-red)', textTransform: 'uppercase' }}>
                Tribe
              </span>
            </span>
          </Link>
          
          <nav className="flex items-center gap-7">
            {DESTINATIONS.map((d) => {
              const active = isActive(pathname, d.match);
              return (
                <Link
                  key={d.href}
                  href={d.href}
                  className="relative py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-200 hover:text-ink"
                  style={{ color: active ? "var(--color-ink)" : "var(--color-ink-muted)" }}
                >
                  {d.label}
                  {active && (
                    <span className="absolute -bottom-[15px] left-0 h-[2px] w-full bg-red shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Floating Dock (CardNav) (<1024px) */}
      <div className="lg:hidden">
        <CardNav items={cardNavItems} />
      </div>
    </>
  );
}
