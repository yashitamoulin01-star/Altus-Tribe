import Link from "next/link";
import { getMyProfileSummary } from "@/lib/dashboard";
import { getUnreadCount } from "@/lib/notifications";
import { Avatar } from "./_shared";
import HeaderSearch from "./HeaderSearch";

// Dashboard header: identity + welcome, global search, notifications, quick
// profile access. Fetches its own data (profile summary + unread count).
export default async function DashboardHeader() {
  const [me, unread] = await Promise.all([
    getMyProfileSummary(),
    getUnreadCount(),
  ]);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-hairline pb-6">
      <Link href="/account" className="flex min-w-0 items-center gap-3">
        <Avatar url={me.photoUrl} name={me.fullName} size={44} />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold text-ink">
            {me.hasIdentity ? `Welcome, ${me.fullName.split(" ")[0]}` : "Welcome to the Tribe"}
          </p>
          <p className="truncate font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            {me.businessName || "Complete your profile"}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <HeaderSearch />
        <Link
          href="/notifications"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative rounded-full p-2 text-ink-muted transition-colors hover:text-ink"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-medium text-paper">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
