import { Suspense } from "react";
import {
  IdentityHero,
  HomeAnnouncements,
  ConclaveCard,
  ReferralRoundSection,
  SacredSpaceCard,
  TodaysNetwork,
} from "./sections";
import ReferralReminder from "./ReferralReminder";
import Reveal from "@/components/Reveal";

export const metadata = { title: "Home — Altus Tribe" };

const CardSkeleton = ({ h = "h-48" }: { h?: string }) => (
  <div className={`${h} animate-pulse rounded-2xl border border-hairline bg-surface-sunk/50`} />
);

// Dashboard — owner's wireframe (2026-07-28):
//   Row 1: Profile (left, smaller) + Announcements (right, bigger), side by side.
//   Row 2: Next Altus Conclave | Referral Round | Sacred Space (three cards).
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-6 px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-12">
      <Suspense fallback={null}>
        <ReferralReminder />
      </Suspense>

      {/* Row 1 — profile + announcements, equal-size boxes side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <Suspense fallback={<CardSkeleton h="h-56" />}>
          <IdentityHero />
        </Suspense>
        <Suspense fallback={<CardSkeleton h="h-56" />}>
          <HomeAnnouncements />
        </Suspense>
      </div>

      {/* Row 2 — Conclave | Referral Round | Sacred Space */}
      <Reveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<CardSkeleton />}>
          <ConclaveCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <ReferralRoundSection />
        </Suspense>
        <SacredSpaceCard />
      </Reveal>

      {/* People you should connect with — recommended, at the end */}
      <Reveal>
        <Suspense fallback={<CardSkeleton h="h-40" />}>
          <TodaysNetwork />
        </Suspense>
      </Reveal>
    </main>
  );
}
