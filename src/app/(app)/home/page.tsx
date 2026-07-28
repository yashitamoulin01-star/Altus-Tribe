import { Suspense } from "react";
import {
  IdentityHero,
  HomeAnnouncements,
  ConclaveCard,
  ReferralRoundSection,
  TodaysNetwork,
} from "./sections";
import ReferralReminder from "./ReferralReminder";
import Reveal from "@/components/Reveal";

export const metadata = { title: "Home — Altus Tribe" };

const CardSkeleton = ({ h = "h-48" }: { h?: string }) => (
  <div className={`${h} animate-pulse rounded-2xl border border-hairline bg-surface-sunk/50`} />
);

// Dashboard (owner spec 2026-07-28). Sidebar shell (AppShell) + stacked priority:
//   compact profile → BIG announcements → conclave + referral rounds → connect.
// No "Welcome back" banner, no "What would you like to do?" cards. Varied reds.
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1100px] space-y-6 px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-12">
      {/* Referral Round reminder — only within 24h / live */}
      <Suspense fallback={null}>
        <ReferralReminder />
      </Suspense>

      {/* Compact profile */}
      <Suspense fallback={<CardSkeleton h="h-24" />}>
        <IdentityHero />
      </Suspense>

      {/* Announcements — the hero of the page */}
      <Suspense fallback={<CardSkeleton h="h-56" />}>
        <HomeAnnouncements />
      </Suspense>

      {/* Conclave + Referral Rounds — paired on desktop */}
      <Reveal className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<CardSkeleton />}>
          <ConclaveCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <ReferralRoundSection />
        </Suspense>
      </Reveal>

      {/* People you should connect with */}
      <Reveal>
        <Suspense fallback={<CardSkeleton />}>
          <TodaysNetwork />
        </Suspense>
      </Reveal>
    </main>
  );
}
