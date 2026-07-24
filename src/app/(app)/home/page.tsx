import { Suspense } from "react";
import { WidgetSkeleton } from "./widgets/_shared";
import DashboardHeader from "./widgets/DashboardHeader";
import ShastraSectionGrid from "./widgets/ShastraSectionGrid";
import FloatingWhatsApp from "./widgets/FloatingWhatsApp";
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

export const metadata = { title: "Home — Productivity Shastra" };

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pt-4 pb-28 sm:px-8 lg:pb-16 space-y-8">
      {/* Header Bar + Greeting */}
      <Suspense fallback={<div className="h-16 animate-pulse rounded-2xl bg-surface-sunk/60" />}>
        <DashboardHeader />
      </Suspense>

      {/* 9-Card Section Grid matching Screenshot layout */}
      <ShastraSectionGrid />

      {/* Bento Grid Command Center */}
      <div className="pt-4 border-t border-hairline/60">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted mb-4">
          TRIBE COMMAND CENTER
        </p>
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
            <Suspense fallback={<WidgetSkeleton />}>
              <EventsWidget />
            </Suspense>
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
      </div>

      {/* Floating WhatsApp Action Button */}
      <FloatingWhatsApp />
    </main>
  );
}


