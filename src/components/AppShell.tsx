"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiSearch, FiMoon, FiSun, FiBell } from "react-icons/fi";
import EcosystemMenu from "./EcosystemMenu";
import MobileMoreSheet from "./MobileMoreSheet";
import { primaryNavigation, mobileBottomNav, isActive } from "@/lib/navigation";

export function AltusLogo() {
  return (
    <div className="flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.png"
        alt="Altus Tribe"
        className="h-8 w-auto object-contain sm:h-9"
        style={{ filter: "drop-shadow(0 2px 4px rgba(183,16,42,0.15)) contrast(1.05)" }}
      />
    </div>
  );
}

export default function AppShell({
  children,
  whatsappNumber,
  whatsappPrefill,
  userName,
  userInitials,
  userPhoto,
  unread,
}: {
  children: React.ReactNode;
  whatsappNumber: string | null;
  whatsappPrefill?: string;
  userName: string;
  userInitials: string;
  userPhoto: string | null;
  unread: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [dark, setDark] = useState(false);
  const [todayStr, setTodayStr] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    // Sync client-only state after mount (theme, date).
    /* eslint-disable react-hooks/set-state-in-effect */
    setDark(document.documentElement.classList.contains("dark"));
    setTodayStr(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    /* eslint-enable react-hooks/set-state-in-effect */

    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // Real Manan Vasa WhatsApp (config-driven; verified fallback passed by layout).
  const digits = (whatsappNumber ?? "").replace(/[^0-9]/g, "");
  const waHref = `https://wa.me/${digits}${whatsappPrefill ? `?text=${encodeURIComponent(whatsappPrefill)}` : ""}`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper text-ink">
      {/* ── Top Header ── */}
      <header
        className={`header-scroll-blend fixed inset-x-0 top-0 z-40 h-14 border-b border-hairline bg-white/95 backdrop-blur sm:h-16 dark:bg-surface/95 ${
          scrolled ? "scrolled" : ""
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-3 sm:gap-5 sm:px-6">
          {/* Brand — allowed to breathe (no toggle button beside it) */}
          <Link href="/home" className="shrink-0 no-underline">
            <AltusLogo />
          </Link>

          {/* Search */}
          <form onSubmit={search} className="hidden min-w-0 flex-1 md:block md:max-w-[300px] lg:max-w-[380px]">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search Participants, Groups & Resources"
                className="h-9 w-full rounded-xl border border-hairline bg-surface-sunk pl-9 pr-3 text-[12px] text-ink transition-colors placeholder:text-ink-muted focus:border-red/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red/8 lg:h-10 lg:pl-10 lg:text-[13px] dark:focus:bg-surface"
              />
            </div>
          </form>

          {/* Ecosystem trigger — BETWEEN search and primary nav (hierarchy: brand → search → ecosystem → nav) */}
          <div className="hidden md:block">
            <EcosystemMenu />
          </div>

          {/* Primary navigation — icon + label, red underline when active (LinkedIn-style, no pills) */}
          <nav className="hidden items-center md:flex lg:gap-1">
            {primaryNavigation.map((d) => {
              const on = isActive(pathname, d.match);
              const Icon = d.icon;
              return (
                <Link
                  key={d.href}
                  href={d.href!}
                  aria-current={on ? "page" : undefined}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] font-medium transition-colors lg:px-4 ${
                    on ? "text-red" : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  <Icon size={19} />
                  <span>{d.label}</span>
                  {on && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-red" />}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex shrink-0 items-center gap-2 md:ml-auto sm:gap-3">
            {todayStr && <span className="hidden text-[12px] font-medium text-ink-muted xl:block">{todayStr}</span>}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline text-ink-secondary transition-colors hover:bg-surface-sunk hover:text-ink sm:h-10 sm:w-10"
            >
              {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-hairline text-ink-secondary transition-colors hover:bg-surface-sunk hover:text-ink sm:h-10 sm:w-10"
            >
              <FiBell size={18} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white shadow-sm">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            <Link
              href="/account"
              className="flex items-center gap-2 rounded-xl border border-hairline p-1 transition-colors hover:border-hairline-bright hover:bg-surface-sunk sm:pr-3"
            >
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-red text-[11px] font-bold text-white sm:h-8 sm:w-8 sm:text-[12px]">
                {userPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>
              <div className="hidden flex-col text-left sm:flex">
                <span className="max-w-[120px] truncate text-[13px] font-semibold leading-tight text-ink">{userName}</span>
                <span className="text-[11px] font-medium leading-tight text-ink-muted">Participant</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content — full width; the left column on Home is CONTENT (profile rail), not nav ── */}
      <div className="flex flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] pt-14 sm:pt-16 lg:pb-0">
        {children}
      </div>

      {/* ── Floating WhatsApp (config-driven; never overlaps the mobile bottom nav) ── */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Manan Vasa on WhatsApp"
        title="Chat with Manan Vasa"
        className="group fixed right-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] z-30 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all hover:scale-105 active:scale-95 sm:right-6 sm:bottom-6"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.16L2 22l4.95-1.3A9.9 9.9 0 1 0 12.04 2Zm0 18.05a8.15 8.15 0 0 1-4.15-1.14l-.3-.18-2.94.77.78-2.86-.2-.3a8.16 8.16 0 1 1 7.01 3.95Zm4.5-6.1c-.25-.12-1.46-.72-1.68-.8-.23-.08-.4-.12-.56.13-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06a6.68 6.68 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62 1.53.66 2.13.72 2.9.6.46-.06 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
        </svg>
      </a>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hairline bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden dark:bg-surface/95">
        {mobileBottomNav.map((d) => {
          const on = isActive(pathname, d.match);
          const Icon = d.icon;
          const cls = `flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
            on ? "font-bold text-red" : "text-ink-muted"
          }`;
          // "More" has no href — it opens the ecosystem sheet.
          return d.href ? (
            <Link key={d.label} href={d.href} className={cls}>
              <Icon size={20} />
              <span className="max-w-full truncate px-0.5">{d.label}</span>
            </Link>
          ) : (
            <button key={d.label} type="button" onClick={() => setMoreOpen(true)} className={`${cls} ${moreOpen ? "text-red" : ""}`}>
              <Icon size={20} />
              <span className="max-w-full truncate px-0.5">{d.label}</span>
            </button>
          );
        })}
      </nav>

      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
