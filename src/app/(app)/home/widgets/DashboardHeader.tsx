import Link from "next/link";
import { getMyProfileSummary } from "@/lib/dashboard";
import { getUnreadCount } from "@/lib/notifications";
import ShastraTopHeader from "./ShastraTopHeader";

// Dashboard header: screenshot-aligned luxury header + welcome greeting.
export default async function DashboardHeader() {
  const [me, unread] = await Promise.all([
    getMyProfileSummary(),
    getUnreadCount(),
  ]);

  const firstName = me.fullName ? me.fullName.split(" ")[0] : me.displayName;
  const roleTitle = me.hasIdentity
    ? [me.category || "Client", me.businessName].filter(Boolean)[0] || "Client"
    : "Member";

  return (
    <div className="space-y-6">
      {/* Top Bar matching Screenshot layout */}
      <ShastraTopHeader
        displayName={me.displayName}
        fullName={me.fullName}
        photoUrl={me.photoUrl}
        roleTitle={roleTitle}
        unreadCount={unread}
      />

      {/* Greeting Banner matching Screenshot */}
      <div className="pt-2 px-1">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Welcome Back, {firstName} <span className="inline-block animate-bounce">👋</span>
        </h1>
      </div>

      {/* Completion nudge if profile isn't 100% */}
      {me.completion < 100 && (
        <Link
          href={me.hasIdentity ? "/account/edit" : "/onboarding"}
          className="flex items-center justify-between gap-3 rounded-2xl border border-red/25 bg-red-muted/10 px-5 py-3.5 backdrop-blur-md transition-all hover:border-red/40"
        >
          <span className="min-w-0">
            <span className="block text-[14px] font-bold text-ink">
              {me.hasIdentity
                ? `Your identity is ${me.completion}% complete`
                : "Set up your Altus identity"}
            </span>
            <span className="block text-[12px] text-ink-muted">
              {me.hasIdentity
                ? "Complete 100% of your profile so the Tribe sees your full work."
                : "It takes a few minutes and every answer autosaves."}
            </span>
          </span>
          <span className="shrink-0 rounded-xl bg-red px-4 py-2 text-[13px] font-bold text-white shadow-md shadow-red/20 transition-transform hover:scale-105">
            {me.hasIdentity ? "Complete →" : "Start →"}
          </span>
        </Link>
      )}
    </div>
  );
}
