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

  const firstName = me.fullName ? me.fullName.split(" ")[0] : me.displayName;
  const subline = me.hasIdentity
    ? [me.businessName, me.category].filter(Boolean).join("  ·  ")
    : "Complete your profile";
  const contactBits = [me.email, me.phone].filter(Boolean);

  return (
    <div className="space-y-4 border-b border-hairline pb-6">
      <header className="flex items-start justify-between gap-4">
        <Link href="/account" className="flex min-w-0 items-center gap-3">
          <Avatar url={me.photoUrl} name={me.displayName} size={44} />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold text-ink">
              {me.hasIdentity ? `Welcome, ${firstName}` : "Welcome to the Tribe"}
            </p>
            <p className="truncate font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              {subline || "Complete your profile"}
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

      {/* Identity detail strip — USP + contact, shown once the member exists. */}
      {me.hasIdentity && (me.usp || me.natureOfBusiness || contactBits.length > 0) && (
        <div className="space-y-1.5 pl-[56px]">
          {(me.usp || me.natureOfBusiness) && (
            <p className="line-clamp-1 text-[13px] leading-snug text-ink-secondary">
              {me.usp || me.natureOfBusiness}
            </p>
          )}
          {contactBits.length > 0 && (
            <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-muted">
              {me.email && <span className="truncate">{me.email}</span>}
              {me.phone && <span>{me.phone}</span>}
            </p>
          )}
        </div>
      )}

      {/* Completion nudge — small prompt to finish the profile to 100%. */}
      {me.completion < 100 && (
        <Link
          href={me.hasIdentity ? "/account/edit" : "/onboarding"}
          className="flex items-center justify-between gap-3 rounded-lg border border-red/25 bg-red/5 px-4 py-2.5 transition-colors hover:border-red/40"
        >
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-ink">
              {me.hasIdentity
                ? `Your profile is ${me.completion}% complete`
                : "Set up your profile"}
            </span>
            <span className="block text-[12px] text-ink-muted">
              {me.hasIdentity
                ? "Complete 100% of your profile so the Tribe sees the full picture."
                : "It takes a few minutes and every answer autosaves."}
            </span>
          </span>
          <span className="shrink-0 rounded-md bg-red px-3 py-1.5 text-[12px] font-medium text-paper">
            {me.hasIdentity ? "Complete →" : "Start →"}
          </span>
        </Link>
      )}
    </div>
  );
}
