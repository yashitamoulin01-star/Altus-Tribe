import { Suspense } from "react";
import {
  IdentityHero,
  HomeAnnouncements,
  NetworkingActions,
  ReferralRoundSection,
  ConclaveCard,
  TodaysNetwork,
  RecentActivity,
  InspirationCorner,
  ElevatorPitches,
} from "./sections";
import ReferralReminder from "./ReferralReminder";
import Reveal from "@/components/Reveal";

export const metadata = { title: "Home — Altus Tribe" };

const CardSkeleton = ({ h = "h-48" }: { h?: string }) => (
  <div className={`${h} animate-pulse rounded-2xl border border-hairline bg-surface-sunk/50`} />
);

// UI-3 Home — Production-grade executive networking command center.
// Fully responsive across Desktop (>=1024px), Tablet (641-1023px), and Mobile (<=640px).
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-6 px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-12">
      {/* Referral Round reminder — only within 24h / live */}
      <Suspense fallback={null}>
        <ReferralReminder />
      </Suspense>

      {/* ── Row 1: Full-width Identity box, then Announcements below (stacked on
           every width — welcome row, full-width identity box, announcements). ── */}
      <Suspense fallback={<CardSkeleton h="h-64" />}>
        <IdentityHero />
      </Suspense>
      <Suspense fallback={<CardSkeleton h="h-48" />}>
        <HomeAnnouncements />
      </Suspense>

      {/* ── Row 2: "What would you like to do?" Action Shortcuts ── */}
      <Reveal>
        <NetworkingActions />
      </Reveal>

      {/* ── Row 3: Referral Rounds, Next Conclave & Today's Network ── */}
      <Reveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<CardSkeleton />}>
          <ReferralRoundSection />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <ConclaveCard />
        </Suspense>
        <div className="sm:col-span-2 lg:col-span-1">
          <Suspense fallback={<CardSkeleton />}>
            <TodaysNetwork />
          </Suspense>
        </div>
      </Reveal>

      {/* ── Row 4: Recent Activity, Inspiration Corner & Elevator Pitches ── */}
      <Reveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <RecentActivity />
        <InspirationCorner />
        <div className="sm:col-span-2 lg:col-span-1">
          <ElevatorPitches />
        </div>
      </Reveal>
    </main>
  );
}
