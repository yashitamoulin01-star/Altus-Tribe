"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Top Nav Items
const TOP_NAV = [
  { href: "/home", label: "Home", match: ["/home"] },
  { href: "/explore", label: "Tribe", match: ["/explore", "/connections", "/messages", "/m/"] },
  { href: "/sacred-space", label: "Sacred Space", match: ["/sacred-space"] },
  { href: "/campus", label: "Campus", match: ["/campus"] },
  { href: "/account", label: "Profile", match: ["/account", "/settings"] },
];

// Left Sidebar Items
const SIDEBAR_ITEMS = [
  {
    href: "/home",
    title: "Home",
    sub: "",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
    match: ["/home"],
  },
  {
    href: "/explore",
    title: "Connect",
    sub: "Connect with Participants",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      </svg>
    ),
    match: ["/explore"],
  },
  {
    href: "/explore?tab=groups",
    title: "Tribe",
    sub: "Groups, Chats & Community",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    match: ["/messages", "/tribe"],
  },
  {
    href: "/sacred-space",
    title: "Sacred Space",
    sub: "Manan Vasa / Team",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    match: ["/sacred-space"],
  },
  {
    href: "/refer",
    title: "Referral Rounds",
    sub: "Wednesdays 10–11 AM",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    match: ["/refer"],
  },
  {
    href: "/campus",
    title: "Altus Conclave",
    sub: "Events & Registrations",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      </svg>
    ),
    match: ["/conclave"],
  },
  {
    href: "/campus",
    title: "Campus",
    sub: "Learning & Ecosystem",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      </svg>
    ),
    match: ["/campus"],
  },
  {
    href: "/account",
    title: "My Profile",
    sub: "Profile & Preferences",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="8" r="4" /><path d="M5 20c0-4 3.5-7 7-7s7 3 7 7" />
      </svg>
    ),
    match: ["/account"],
  },
  {
    href: "/notifications",
    title: "Notifications",
    sub: "9+",
    badge: "9+",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    ),
    match: ["/notifications"],
  },
  {
    href: "/settings",
    title: "Settings",
    sub: "Account & Preferences",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    match: ["/settings"],
  },
];

// Mobile Bottom Nav Items
const MOBILE_NAV = [
  {
    href: "/home",
    label: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
    match: ["/home"],
  },
  {
    href: "/explore",
    label: "Connect",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      </svg>
    ),
    match: ["/explore"],
  },
  {
    href: "/explore?tab=groups",
    label: "Tribe",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    match: ["/messages", "/tribe"],
  },
  {
    href: "/campus",
    label: "Campus",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      </svg>
    ),
    match: ["/campus"],
  },
  {
    href: "/account",
    label: "More",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
      </svg>
    ),
    match: ["/account", "/settings", "/notifications", "/sacred-space", "/refer"],
  },
];

function isActive(pathname: string, match: string[]) {
  return match.some((m) =>
    m.endsWith("/") ? pathname.startsWith(m) : pathname === m || pathname.startsWith(`${m}/`),
  );
}

export function AltusLogo() {
  return (
    <div className="flex items-center gap-2">
      {/* Light theme logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.png"
        alt="Altus Tribe"
        className="h-7 sm:h-9 w-auto object-contain dark:hidden"
      />
      {/* Dark theme logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-light.png"
        alt="Altus Tribe"
        className="h-7 sm:h-9 w-auto object-contain hidden dark:block"
      />
    </div>
  );
}

export default function AppShell({
  children,
  whatsappNumber,
  whatsappPrefill,
}: {
  children: React.ReactNode;
  whatsappNumber: string | null;
  whatsappPrefill?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [todayStr, setTodayStr] = useState("");

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setTodayStr(
      new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    );

    // Restore user preference for sidebar state
    const saved = localStorage.getItem("altus-sidebar-open");
    if (saved !== null) {
      setSidebarOpen(saved === "true");
    }

    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleSidebar = () => {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    localStorage.setItem("altus-sidebar-open", String(next));
  };

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

  const digits = (whatsappNumber ?? "").replace(/[^0-9]/g, "");
  const waHref = digits.length >= 8
    ? `https://wa.me/${digits}${whatsappPrefill ? `?text=${encodeURIComponent(whatsappPrefill)}` : ""}`
    : "https://wa.me/919999999999?text=Hi%20Manan%20Vasa%2C%20I%20have%20a%20question%20regarding%20Altus%20Tribe.";

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ── Top Header ── */}
      <header className={`fixed inset-x-0 top-0 z-40 h-14 border-b border-hairline bg-white/95 backdrop-blur sm:h-16 header-scroll-blend dark:bg-surface/95 ${
        scrolled ? "scrolled" : ""
      }`}>
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-3 sm:px-6 gap-3 sm:gap-6">
          {/* Logo & Sidebar Toggle Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Sidebar Open/Close Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline text-ink-secondary transition-colors hover:bg-surface-sunk hover:text-ink focus:outline-none"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>

            <Link href="/home" className="no-underline">
              <AltusLogo />
            </Link>
          </div>

          {/* Desktop/Tablet Top Navigation Links (>= 768px) */}
          <nav className="hidden items-center gap-1 md:flex lg:gap-1.5">
            {TOP_NAV.map((d) => {
              const on = isActive(pathname, d.match);
              return (
                <Link
                  key={d.href}
                  href={d.href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-semibold transition-all lg:px-4 lg:py-2 lg:text-[14px] ${
                    on
                      ? "bg-red text-white shadow-sm shadow-red/20"
                      : "text-ink-secondary hover:bg-surface-sunk hover:text-ink"
                  }`}
                >
                  {d.label}
                </Link>
              );
            })}
          </nav>

          {/* Search bar (Desktop & Tablet >= 768px) */}
          <form onSubmit={search} className="hidden md:block w-full max-w-[260px] lg:max-w-[340px]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search Participants, Groups & Resources"
                className="h-9 w-full rounded-xl border border-hairline bg-surface-sunk pl-9 pr-3 text-[12px] text-ink placeholder:text-ink-muted transition-colors focus:border-red/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red/8 lg:h-10 lg:pl-10 lg:pr-4 lg:text-[13px] dark:focus:bg-surface"
              />
            </div>
          </form>

          {/* Right Controls */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {todayStr && (
              <span className="hidden xl:block text-[12px] font-medium text-ink-muted">
                {todayStr}
              </span>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline text-ink-secondary transition-colors hover:bg-surface-sunk hover:text-ink sm:h-10 sm:w-10"
            >
              {dark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              )}
            </button>

            <Link href="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-hairline text-ink-secondary transition-colors hover:bg-surface-sunk hover:text-ink sm:h-10 sm:w-10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white shadow-sm">
                9+
              </span>
            </Link>

            <Link href="/account" className="flex items-center gap-2 rounded-xl border border-hairline p-1 sm:pr-3 transition-colors hover:border-hairline-bright hover:bg-surface-sunk">
              <div className="h-7 w-7 sm:h-8 sm:w-8 overflow-hidden rounded-full bg-red text-white flex items-center justify-center text-[11px] sm:text-[12px] font-bold">
                YM
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[13px] font-semibold text-ink leading-tight">Yashita Mouli</span>
                <span className="text-[11px] font-medium text-ink-muted leading-tight">Member</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Collapsible Left Sidebar (Desktop >= 1024px) ── */}
      <aside
        className={`fixed left-0 top-14 sm:top-16 bottom-0 z-30 hidden border-r border-hairline bg-white p-3.5 overflow-y-auto transition-all duration-300 ease-in-out lg:flex lg:flex-col justify-between dark:bg-surface ${
          sidebarOpen ? "w-60 xl:w-64 translate-x-0 opacity-100" : "w-0 -translate-x-full opacity-0 p-0 border-none pointer-events-none"
        }`}
      >
        <div className="space-y-1 scroll-mask-y">
          {SIDEBAR_ITEMS.map((item) => {
            const on = isActive(pathname, item.match);
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  on
                    ? "bg-red/8 text-red shadow-sm border border-red/15 font-semibold"
                    : "text-ink-secondary hover:bg-surface-sunk hover:text-ink"
                }`}
              >
                <span className={`mt-0.5 shrink-0 ${on ? "text-red" : "text-ink-muted"}`}>
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-[13px] xl:text-[14px] leading-tight ${on ? "font-bold text-red" : "font-semibold text-ink"}`}>
                      {item.title}
                    </p>
                    {item.badge && (
                      <span className="rounded-full bg-red px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.sub && (
                    <p className="mt-0.5 truncate text-[11px] text-ink-muted leading-tight">
                      {item.sub}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Left WhatsApp CTA */}
        <div className="pt-3 border-t border-hairline">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-left transition-colors hover:bg-emerald-500/10"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.81 9.81 0 0 0 12.04 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">Chat with Manan Vasa</p>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-500">On WhatsApp</p>
            </div>
          </a>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div
        className={`flex flex-1 flex-col pt-14 sm:pt-16 pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:pl-60 xl:pl-64" : "lg:pl-0"
        }`}
      >
        {children}
      </div>

      {/* ── Floating WhatsApp Button (shown when sidebar is closed or on mobile/tablet) ── */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Manan Vasa on WhatsApp"
        title="Chat with Manan Vasa"
        className={`group fixed right-4 bottom-[calc(3.75rem+env(safe-area-inset-bottom)+0.75rem)] z-30 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all hover:scale-105 active:scale-95 sm:right-6 lg:bottom-6 ${
          sidebarOpen ? "lg:hidden" : "lg:flex"
        }`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.16L2 22l4.95-1.3A9.9 9.9 0 1 0 12.04 2Zm0 18.05a8.15 8.15 0 0 1-4.15-1.14l-.3-.18-2.94.77.78-2.86-.2-.3a8.16 8.16 0 1 1 7.01 3.95Zm4.5-6.1c-.25-.12-1.46-.72-1.68-.8-.23-.08-.4-.12-.56.13-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06a6.68 6.68 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62 1.53.66 2.13.72 2.9.6.46-.06 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
        </svg>
      </a>

      {/* ── Mobile Bottom Navigation (Mobile <= 640px) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hairline bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden dark:bg-surface/95">
        {MOBILE_NAV.map((d) => {
          const on = isActive(pathname, d.match);
          return (
            <Link
              key={d.label}
              href={d.href}
              className={`flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                on ? "font-bold text-red" : "text-ink-muted"
              }`}
            >
              <span className={on ? "text-red" : "text-ink-muted"}>{d.icon}</span>
              <span className="max-w-full truncate px-0.5">{d.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
