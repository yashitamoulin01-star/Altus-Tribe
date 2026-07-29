"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";

// Universal search / command palette. Searches EVERYTHING: pages, features, and
// actions (sign out, admin panel, settings…), plus a fallback to search
// participants in the directory. Type → filtered results → Enter/click to go.
type Cmd = {
  label: string;
  hint?: string;
  keywords: string;
  href?: string;
  action?: "signout";
  admin?: boolean;
};

const COMMANDS: Cmd[] = [
  { label: "Home", href: "/home", keywords: "home dashboard start" },
  { label: "Tribe", href: "/groups", keywords: "tribe groups community chat conversations" },
  { label: "Explore Participants", href: "/explore", keywords: "explore people participants connect directory members find" },
  { label: "Connections", href: "/connections", keywords: "connections network requests" },
  { label: "Messages", href: "/messages", keywords: "messages chat dm inbox" },
  { label: "Sacred Space", href: "/sacred-space", keywords: "sacred space manan vasa team announcements" },
  { label: "Campus", href: "/campus", keywords: "campus learning courses resources videos ecosystem" },
  { label: "Referral Rounds", href: "/referral-rounds", keywords: "referral rounds wednesday session" },
  { label: "Notifications", href: "/notifications", keywords: "notifications alerts activity" },
  { label: "My Profile", href: "/account", keywords: "profile account me my" },
  { label: "Edit Profile", href: "/account/edit", keywords: "edit profile update identity usp photo" },
  { label: "Settings", href: "/settings", keywords: "settings preferences controls" },
  { label: "Security", href: "/settings/security", keywords: "security password 2fa mfa sessions privacy" },
  { label: "Notification Settings", href: "/settings/notifications", keywords: "notification settings email push digest" },
  { label: "Refer Someone", href: "/refer", keywords: "refer invite share productivity shastra" },
  { label: "Request Membership", href: "/request-access", keywords: "request membership access join apply" },
  { label: "Admin Panel", href: "/admin", keywords: "admin panel roster crm import export consultants manage", admin: true },
  { label: "Admin — Access Requests", href: "/admin/access-requests", keywords: "admin access requests approve reject allowlist", admin: true },
  { label: "Sign out", action: "signout", keywords: "sign out logout log out exit leave" },
];

const ICON_SEARCH = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);

export default function GlobalSearch({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const pool = COMMANDS.filter((c) => !c.admin || isAdmin);
    if (!s) return pool.slice(0, 8);
    return pool
      .map((c) => {
        const hay = `${c.label} ${c.keywords}`.toLowerCase();
        const idx = hay.indexOf(s);
        return idx >= 0 ? { c, score: (c.label.toLowerCase().startsWith(s) ? 0 : 1) + idx / 100 } : null;
      })
      .filter((x): x is { c: Cmd; score: number } => x !== null)
      .sort((a, b) => a.score - b.score)
      .map((x) => x.c)
      .slice(0, 8);
  }, [q, isAdmin]);

  const go = (c: Cmd) => {
    setOpen(false);
    setQ("");
    if (c.action === "signout") { void signOut(); return; }
    if (c.href) router.push(c.href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results[active]) return go(results[active]);
    const t = q.trim();
    router.push(t ? `/explore?q=${encodeURIComponent(t)}` : "/explore");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Escape") setOpen(false);
  };

  const t = q.trim();

  return (
    <form onSubmit={submit} className="relative mx-auto hidden w-full max-w-[440px] md:block">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">{ICON_SEARCH}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150); }}
          onKeyDown={onKey}
          placeholder="Search anything — people, features, settings…"
          className="h-10 w-full rounded-xl border border-hairline bg-surface-sunk pl-10 pr-3 text-[13px] text-ink placeholder:text-ink-muted transition-colors focus:border-red/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red/8 dark:focus:bg-surface"
        />
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-hairline bg-white shadow-lg dark:bg-surface"
          onMouseDown={() => clearTimeout(blurTimer.current)}
        >
          <ul className="max-h-[360px] overflow-y-auto py-1">
            {results.map((c, i) => (
              <li key={c.label}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(c)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] ${i === active ? "bg-red/8 text-red" : "text-ink hover:bg-surface-hover"}`}
                >
                  <span className="font-medium">{c.label}</span>
                  {c.admin && <span className="rounded bg-red/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red">Admin</span>}
                </button>
              </li>
            ))}
            {/* Always offer a directory search */}
            <li className="border-t border-hairline">
              <button
                type="button"
                onMouseEnter={() => setActive(results.length)}
                onClick={() => { setOpen(false); router.push(t ? `/explore?q=${encodeURIComponent(t)}` : "/explore"); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] ${active === results.length ? "bg-red/8 text-red" : "text-ink-secondary hover:bg-surface-hover"}`}
              >
                {ICON_SEARCH}
                <span>Search participants{t ? ` for “${t}”` : ""} →</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </form>
  );
}
