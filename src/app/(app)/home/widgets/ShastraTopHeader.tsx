"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface ShastraUserProps {
  displayName: string;
  fullName?: string | null;
  photoUrl?: string | null;
  roleTitle?: string;
  unreadCount: number;
}

export default function ShastraTopHeader({
  displayName,
  fullName,
  photoUrl,
  roleTitle = "Client",
  unreadCount,
}: ShastraUserProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [dateStr, setDateStr] = useState("Jul 25, 2026");

  useEffect(() => {
    // Current date format matching screenshot: "Jul 25, 2026"
    const now = new Date();
    const formatted = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    setDateStr(formatted);

    // Initial theme check
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    setIsDark(!isLight);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const root = document.documentElement;
    if (nextDark) {
      root.classList.add("dark");
      root.removeAttribute("data-theme");
      root.style.colorScheme = "dark";
      localStorage.setItem("altus-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
      localStorage.setItem("altus-theme", "light");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
  };

  const nameParts = (fullName || displayName).split(" ");
  const firstName = nameParts[0] || "User";
  const initials = nameParts.length >= 2 ? `${nameParts[0][0]}${nameParts[1][0]}` : nameParts[0]?.substring(0, 2).toUpperCase() || "YM";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline/60 bg-surface/95 backdrop-blur-xl px-4 py-3 sm:px-8">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4">
        {/* Brand Logo (Screenshot Style) */}
        <Link href="/home" className="flex items-center gap-3 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-red-500 shadow-md shadow-red-500/25">
            <span className="font-mono text-lg font-black text-white">A</span>
          </div>
          <div className="hidden sm:block">
            <span className="block text-[15px] font-extrabold tracking-tight text-ink leading-tight">
              Productivity
            </span>
            <span className="block text-[12px] font-bold text-red tracking-wider uppercase leading-none">
              Shastra
            </span>
          </div>
        </Link>

        {/* Center Pill Search Bar (Screenshot Style) */}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-lg hidden md:block">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Tools, Sections & Settings..."
              className="w-full rounded-full border border-hairline/80 bg-surface-sunk/80 py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted/80 focus:border-red focus:bg-surface focus:outline-none focus:ring-2 focus:ring-red/20 transition-all"
            />
          </div>
        </form>

        {/* Right Status Actions (Screenshot Style) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Date Badge */}
          <span className="hidden lg:inline-block font-mono text-xs text-ink-muted font-medium px-2 py-1 rounded-md bg-surface-sunk/50">
            {dateStr}
          </span>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline/80 bg-surface-sunk text-ink-secondary hover:text-ink hover:border-hairline-bright transition-all"
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          {/* Notifications Bell */}
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-hairline/80 bg-surface-sunk text-ink-secondary hover:text-ink hover:border-hairline-bright transition-all"
            aria-label="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 font-mono text-[10px] font-bold text-white shadow-sm shadow-red/40 animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Avatar Badge (Screenshot Style) */}
          <Link href="/account" className="flex items-center gap-2.5 rounded-full border border-hairline/80 bg-surface-sunk p-1 pr-3 hover:border-hairline-bright transition-all">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-red text-xs font-bold text-white overflow-hidden shadow-sm shadow-red/30">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={firstName} className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold leading-tight text-ink truncate max-w-[120px]">
                {fullName || displayName}
              </p>
              <p className="text-[10px] font-mono text-ink-muted leading-none">
                {roleTitle || "Client"}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
