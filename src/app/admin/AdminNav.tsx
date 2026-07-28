"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/access-requests", label: "Access" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/broadcasts", label: "Broadcasts" },
  { href: "/admin/members", label: "Users" },
  { href: "/admin/consultants", label: "Consultants" },
  { href: "/admin/assets", label: "Assets" },
  { href: "/admin/taxonomies", label: "Categories" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/conclave", label: "Conclave" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/audit", label: "Activities" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/exports", label: "Exports" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="mx-auto max-w-[1200px] px-6 sm:px-10">
      <ul className="flex gap-6 overflow-x-auto">
        {TABS.map((t) => {
          const on = active(t.href, t.exact);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className="relative block whitespace-nowrap py-3 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors"
                style={{ color: on ? "var(--color-ink)" : "var(--color-ink-muted)" }}
              >
                {t.label}
                {on && <span className="absolute -bottom-px left-0 h-[2px] w-full bg-red" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
