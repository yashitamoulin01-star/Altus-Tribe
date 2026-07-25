import { Suspense } from "react";
import ReferralRoundCard from "./ReferralRoundCard";
import {
  IdentityHero,
  HomeAnnouncements,
  NetworkingActions,
  ConclaveCard,
  TodaysNetwork,
  RecentActivity,
  InspirationCorner,
  ElevatorPitches,
} from "./sections";

export const metadata = { title: "Home — Altus Tribe" };

const CardSkeleton = ({ h = "h-48" }: { h?: string }) => (
  <div className={`${h} animate-pulse rounded-2xl border border-hairline bg-surface-sunk/50`} />
);

// UI-3 Home — Production-grade executive networking command center.
// Fully responsive across Desktop (>=1024px), Tablet (641-1023px), and Mobile (<=640px).
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-6 px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-12">
      {/* ── Row 1: Identity Hero & Announcements (Desktop 2-col, Tablet/Mobile 1-col) ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<CardSkeleton h="h-64" />}>
          <IdentityHero />
        </Suspense>
        <Suspense fallback={<CardSkeleton h="h-64" />}>
          <HomeAnnouncements />
        </Suspense>
      </div>

      {/* ── Row 2: "What would you like to do?" Action Shortcuts ── */}
      <NetworkingActions />

      {/* ── Row 3: Referral Rounds, Next Conclave & Today's Network ── */}
      {/* Desktop (>=1024px) = 3 Columns; Tablet (641-1023px) = 2 Col top + 1 Col bottom; Mobile = Stacked */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ReferralRoundCard />
        <Suspense fallback={<CardSkeleton />}>
          <ConclaveCard />
        </Suspense>
        <div className="sm:col-span-2 lg:col-span-1">
          <Suspense fallback={<CardSkeleton />}>
            <TodaysNetwork />
          </Suspense>
        </div>
      </div>

      {/* ── Row 4: Recent Activity, Inspiration Corner & Elevator Pitches ── */}
      {/* Desktop (>=1024px) = 3 Columns; Tablet (641-1023px) = 2 Col top + 1 Col bottom; Mobile = Stacked */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <RecentActivity />
        <InspirationCorner />
        <div className="sm:col-span-2 lg:col-span-1">
          <ElevatorPitches />
        </div>
      </div>
    </main>
  );
}
