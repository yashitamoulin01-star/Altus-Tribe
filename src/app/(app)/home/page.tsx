import { Suspense } from "react";
import ReferralRoundCard from "./ReferralRoundCard";
import {
  IdentityHero,
  NetworkingActions,
  ConclaveCard,
  TodaysNetwork,
  HomeAnnouncements,
  EcosystemShortcuts,
  ElevatorPitches,
  InspirationHighlights,
} from "./sections";

export const metadata = { title: "Home — Altus Tribe" };

const CardSkeleton = ({ h = "h-40" }: { h?: string }) => (
  <div className={`${h} animate-pulse rounded-[20px] border border-hairline bg-surface-sunk/50`} />
);

// UI-3 Home — a networking command center (not a SaaS dashboard). Hierarchy:
// identity → networking actions → referral/event opportunity → today's network →
// announcements → ecosystem. Deferred surfaces (pitches, inspiration) self-hide
// until real data exists.
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1120px] space-y-8 px-5 pt-6 pb-28 sm:px-8 lg:pb-12">
      <Suspense fallback={<CardSkeleton h="h-56" />}>
        <IdentityHero />
      </Suspense>

      <NetworkingActions />

      <div className="grid gap-4 lg:grid-cols-2">
        <ReferralRoundCard />
        <Suspense fallback={<CardSkeleton />}>
          <ConclaveCard />
        </Suspense>
      </div>

      <Suspense fallback={<CardSkeleton h="h-48" />}>
        <TodaysNetwork />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <HomeAnnouncements />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <EcosystemShortcuts />
      </Suspense>

      {/* Self-hide until real data exists (no fake content). */}
      <Suspense fallback={null}>
        <ElevatorPitches />
      </Suspense>
      <Suspense fallback={null}>
        <InspirationHighlights />
      </Suspense>
    </main>
  );
}
