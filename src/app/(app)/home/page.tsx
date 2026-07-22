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
import { MagicBentoGrid, MagicBentoCard } from "@/components/MagicBento";

export const metadata = { title: "Home — Altus Tribe" };

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pt-6 pb-28 sm:px-8 lg:pb-12 space-y-6">
      {/* Header Bar */}
      <Suspense fallback={<div className="h-16 animate-pulse rounded-xl bg-surface-sunk/60" />}>
        <DashboardHeader />
      </Suspense>

      {/* Quick Actions Dock */}
      <QuickActions />

      {/* Bento Grid Command Center */}
      <MagicBentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Summary Feature Card */}
        <MagicBentoCard span="col-span-1 md:col-span-2" accentBorder>
          <Suspense fallback={<WidgetSkeleton lines={4} />}>
            <ProfileSummaryCard />
          </Suspense>
        </MagicBentoCard>

        {/* Announcements Bento Tile */}
        <MagicBentoCard span="col-span-1">
          <Suspense fallback={<WidgetSkeleton />}>
            <AnnouncementsWidget />
          </Suspense>
        </MagicBentoCard>

        {/* Suggested Members Bento Tile */}
        <MagicBentoCard span="col-span-1 md:col-span-2">
          <Suspense fallback={<WidgetSkeleton lines={4} />}>
            <SuggestedMembers />
          </Suspense>
        </MagicBentoCard>

        {/* Events Bento Tile */}
        <MagicBentoCard span="col-span-1">
          <EventsWidget />
        </MagicBentoCard>

        {/* Recent Messages Bento Tile */}
        <MagicBentoCard span="col-span-1">
          <Suspense fallback={<WidgetSkeleton />}>
            <RecentMessages />
          </Suspense>
        </MagicBentoCard>

        {/* Campus Widget Bento Tile */}
        <MagicBentoCard span="col-span-1">
          <Suspense fallback={<WidgetSkeleton />}>
            <CampusWidget />
          </Suspense>
        </MagicBentoCard>

        {/* Notifications Bento Tile */}
        <MagicBentoCard span="col-span-1">
          <Suspense fallback={<WidgetSkeleton />}>
            <NotificationsWidget />
          </Suspense>
        </MagicBentoCard>

        {/* Referral & Inspiration Row */}
        <MagicBentoCard span="col-span-1 md:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <ReferralWidget />
            <Suspense fallback={<WidgetSkeleton />}>
              <InspirationWidget />
            </Suspense>
          </div>
        </MagicBentoCard>
      </MagicBentoGrid>
    </main>
  );
}

