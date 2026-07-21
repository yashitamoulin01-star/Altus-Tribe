import { Suspense } from "react";
import { WidgetSkeleton } from "./widgets/_shared";
import DashboardHeader from "./widgets/DashboardHeader";
import QuickActions from "./widgets/QuickActions";
import ProfileSummaryCard from "./widgets/ProfileSummaryCard";
import AnnouncementsWidget from "./widgets/AnnouncementsWidget";
import SuggestedMembers from "./widgets/SuggestedMembers";
import RecentMessages from "./widgets/RecentMessages";
import CampusWidget from "./widgets/CampusWidget";
import ReferralWidget from "./widgets/ReferralWidget";
import EventsWidget from "./widgets/EventsWidget";
import InspirationWidget from "./widgets/InspirationWidget";
import NotificationsWidget from "./widgets/NotificationsWidget";

export const metadata = { title: "Home — Altus Tribe" };

// Home dashboard — the command center (Phase 3). Componentized: each widget is
// an independent async server component wrapped in Suspense so it streams on its
// own. Add or reorder widgets without touching the others.
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pt-6 pb-24 sm:px-8 lg:pb-10">
      <Suspense fallback={<div className="h-16 animate-pulse rounded-lg bg-surface-sunk" />}>
        <DashboardHeader />
      </Suspense>

      {/* Quick actions — entry points into every module */}
      <div className="mt-6">
        <QuickActions />
      </div>

      {/* Two-column command grid (single column on mobile) */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <Suspense fallback={<WidgetSkeleton lines={4} />}>
            <ProfileSummaryCard />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <AnnouncementsWidget />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton lines={4} />}>
            <SuggestedMembers />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <RecentMessages />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <CampusWidget />
          </Suspense>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <ReferralWidget />
          <EventsWidget />
          <Suspense fallback={<WidgetSkeleton />}>
            <InspirationWidget />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <NotificationsWidget />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
