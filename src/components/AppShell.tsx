"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "@/app/(auth)/actions";
import GlobalSearch from "./GlobalSearch";
import TribeLiveTicker, { type TickerItem } from "./TribeLiveTicker";

// Left Sidebar Items — grouped (Workspace / Community / Learning / System).
// Profile + Settings intentionally live in the bottom Account Dock, not here.
const SIDEBAR_ITEMS = [
  {
    group: "Workspace",
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
    group: "Workspace",
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
    group: "Workspace",
    href: "/groups",
    title: "Tribe",
    sub: "Groups, Chats & Community",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    match: ["/groups", "/messages", "/tribe"],
  },
  {
    group: "Community",
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
    group: "Community",
    href: "/referral-rounds",
    title: "Referral Rounds",
    sub: "Wednesdays 10–11 AM",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    match: ["/referral-rounds"],
  },
  {
    group: "Community",
    href: "/conclave",
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
    group: "Learning",
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
    group: "System",
    href: "/notifications",
    title: "Notifications",
    sub: "",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    ),
    match: ["/notifications"],
  },
];
const NAV_GROUP_ORDER = ["Workspace", "Community", "Learning", "System"];

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
    href: "/groups",
    label: "Tribe",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    match: ["/groups", "/messages", "/tribe"],
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
    <div className="flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.png"
        alt="Altus Tribe"
        className="h-11 sm:h-14 w-auto object-contain"
        style={{
          filter: 'drop-shadow(0 2px 5px rgba(183,16,42,0.20)) contrast(1.12) saturate(1.08)',
          imageRendering: '-webkit-optimize-contrast',
        }}
      />
    </div>
  );
}

export default function AppShell({
  children,
  whatsappNumber,
  whatsappPrefill,
  userName = "Participant",
  userInitials = "·",
  userPhoto = null,
  completion = 0,
  profileSlug = null,
  requiredComplete = false,
  tickerItems = [],
  unread,
  isAdmin = false,
}: {
  children: React.ReactNode;
  whatsappNumber: string | null;
  whatsappPrefill?: string;
  userName?: string;
  userInitials?: string;
  userPhoto?: string | null;
  completion?: number;
  profileSlug?: string | null;
  requiredComplete?: boolean;
  tickerItems?: TickerItem[];
  unread: number;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [todayStr, setTodayStr] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Sync client-only state after mount (theme, date, saved sidebar pref).
    /* eslint-disable react-hooks/set-state-in-effect */
    setDark(document.documentElement.classList.contains("dark"));
    setTodayStr(
      new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    );

    // Restore user preference for sidebar state
    const saved = localStorage.getItem("altus-sidebar-open");
    if (saved !== null) {
      setSidebarOpen(saved === "true");
    }
    /* eslint-enable react-hooks/set-state-in-effect */

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

  // Real Manan Vasa WhatsApp (config-driven, verified fallback passed by layout).
  const digits = (whatsappNumber ?? "").replace(/[^0-9]/g, "");
  const waHref = `https://wa.me/${digits}${whatsappPrefill ? `?text=${encodeURIComponent(whatsappPrefill)}` : ""}`;

  // Account Dock — profile is only viewable once the required fields are done.
  const roleLabel = isAdmin ? "Admin" : "Participant";
  const li = (d: string) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
  const accountLinks = [
    // View → the PUBLIC profile as others see it (never the editor).
    { label: "View my profile", href: profileSlug ? `/m/${profileSlug}` : "/account", icon: li('<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>') },
    { label: "Edit profile", href: "/account/edit", icon: li('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>') },
    { label: "Account", href: "/account", icon: li('<circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3.5-7 7-7s7 3 7 7"/>') },
    { label: "Settings", href: "/settings", icon: li('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>') },
    { label: "Security", href: "/settings/security", icon: li('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>') },
    ...(isAdmin ? [{ label: "Admin Dashboard", href: "/admin", icon: li('<path d="m12 2 7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/><path d="m9 12 2 2 4-4"/>') }] : []),
  ];

  return (
    <div className="min-h-screen bg-paper text-ink overflow-x-hidden">
      {/* ── Top Header ── */}
      <header className={`fixed inset-x-0 top-0 z-40 h-16 border-b border-hairline bg-white/95 backdrop-blur sm:h-20 header-scroll-blend dark:bg-surface/95 ${
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
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus:outline-none"
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

          {/* Top navigation removed — the left sidebar is the primary nav. */}

          {/* Universal search / command palette */}
          <GlobalSearch isAdmin={isAdmin} />

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
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white shadow-sm">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            {/* Profile + completion — moved from the sidebar into the top nav.
                The avatar's red ring shows profile completion at a glance. */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                aria-label="Account menu"
                className="flex items-center gap-1.5 rounded-full transition-colors hover:opacity-90"
                title={`Profile ${completion}% complete`}
              >
                <span
                  className="relative flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10"
                  style={{ background: `conic-gradient(var(--color-red) ${Math.min(100, Math.max(0, completion)) * 3.6}deg, rgba(0,0,0,0.10) 0deg)` }}
                >
                  <span className="flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full border-2 border-white bg-surface-sunk text-[11px] font-bold text-ink-muted sm:h-[34px] sm:w-[34px] dark:border-surface">
                    {userPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />
                    ) : (
                      userInitials
                    )}
                  </span>
                </span>
                <span className="hidden text-[10px] font-semibold leading-none text-red sm:inline">{completion}%</span>
                <svg className={`hidden shrink-0 text-ink-muted transition-transform sm:block ${accountOpen ? "rotate-180" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              </button>

              {accountOpen && (
                <>
                  <button type="button" aria-label="Close account menu" onClick={() => setAccountOpen(false)} className="fixed inset-0 z-10 cursor-default" tabIndex={-1} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-xl border border-hairline bg-white shadow-lg dark:bg-surface">
                    <div className="border-b border-hairline px-3.5 py-3">
                      <p className="truncate text-[14px] font-semibold text-ink">{userName}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted">
                        {isAdmin && <span className="inline-block h-1.5 w-1.5 rounded-full bg-red" />}
                        {roleLabel}
                      </p>
                      <Link href="/account/edit" onClick={() => setAccountOpen(false)} className="mt-2.5 block">
                        <span className="flex items-center justify-between text-[10px] font-semibold text-red">
                          <span>{requiredComplete ? "Profile complete" : "Complete your profile"}</span>
                          <span>{completion}%</span>
                        </span>
                        <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-red/15">
                          <span className="block h-full rounded-full bg-red" style={{ width: `${Math.min(100, Math.max(0, completion))}%` }} />
                        </span>
                      </Link>
                    </div>
                    {accountLinks.map((l) => (
                      <Link key={l.label} href={l.href} onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-surface-sunk hover:text-ink">
                        <span className="text-ink-muted">{l.icon}</span>
                        {l.label}
                      </Link>
                    ))}
                    <form action={signOut}>
                      <button type="submit" className="flex w-full items-center gap-2.5 border-t border-hairline px-3.5 py-2.5 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-red/5 hover:text-red">
                        <span className="text-ink-muted">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        </span>
                        Sign out
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ── Collapsible Left Sidebar (Desktop >= 1024px) ── */}
      <aside
        className={`fixed left-0 top-16 sm:top-20 bottom-0 z-30 hidden border-r border-hairline bg-white p-3 overflow-y-auto transition-all duration-300 ease-in-out lg:flex lg:flex-col dark:bg-surface ${
          sidebarOpen ? "w-60 xl:w-64 translate-x-0 opacity-100" : "w-0 -translate-x-full opacity-0 p-0 border-none pointer-events-none"
        }`}
      >
        <div className="space-y-1.5">
          {NAV_GROUP_ORDER.map((group) => (
            <div key={group} className="space-y-0.5">
              <p className="px-3 pb-0.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted/70">
                {group}
              </p>
              {SIDEBAR_ITEMS.filter((i) => i.group === group).map((item) => {
                const on = isActive(pathname, item.match);
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`group/nav relative flex items-start gap-3 rounded-xl px-3 py-2 transition-all ${
                      on
                        ? "border border-red/15 bg-gradient-to-r from-red/10 to-red/[0.02] font-semibold text-red shadow-sm"
                        : "text-ink-secondary hover:bg-surface-sunk hover:text-ink"
                    }`}
                  >
                    {on && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-red" />}
                    <span className={`mt-0.5 shrink-0 transition-transform group-hover/nav:scale-105 ${on ? "text-red" : "text-ink-muted"}`}>
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] leading-tight xl:text-[14px] ${on ? "font-bold text-red" : "font-semibold text-ink"}`}>
                        {item.title}
                      </p>
                      {item.sub && (
                        <p className="mt-0.5 truncate text-[11px] leading-tight text-ink-muted">
                          {item.sub}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

      </aside>

      {/* ── Main Content Area ── */}
      <div
        className={`flex flex-1 flex-col pt-16 sm:pt-20 pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:pl-60 xl:pl-64" : "lg:pl-0"
        }`}
      >
        {/* Tribe Live — announcement ribbon attached under the nav, always on */}
        <TribeLiveTicker items={tickerItems} />
        {children}
      </div>

      {/* ── Floating WhatsApp Button — always in the bottom-right corner ── */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Manan Vasa on WhatsApp"
        title="Chat with Manan Vasa"
        className="group fixed right-4 bottom-[calc(3.75rem+env(safe-area-inset-bottom)+0.75rem)] z-30 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all hover:scale-105 active:scale-95 sm:right-6 lg:bottom-6"
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
