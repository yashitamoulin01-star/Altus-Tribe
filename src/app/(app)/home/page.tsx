import { Suspense } from "react";
import ProfileSidebar from "./ProfileSidebar";
import RightRail from "./RightRail";
import HomeFeed from "./HomeFeed";
import ReferralReminder from "./ReferralReminder";
import { getMyProfileSummary } from "@/lib/dashboard";
import { getAnnouncements } from "@/lib/community";

export const metadata = { title: "Home — Altus Tribe" };

const Skeleton = ({ h = "h-40" }: { h?: string }) => (
  <div className={`${h} animate-pulse rounded-2xl border border-hairline bg-surface-sunk/50`} />
);

// UI-3 Home — community-feed command center. 3-column on desktop
// (profile · feed · rail), stacks on tablet/mobile.
async function FeedColumn() {
  const [me, announcements] = await Promise.all([getMyProfileSummary(), getAnnouncements()]);
  const a = announcements.find((x) => x.pinnedAt) ?? announcements[0] ?? null;
  const pinned = a
    ? { title: a.title, body: a.body, date: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "" }
    : null;
  return <HomeFeed userName={me.fullName || me.businessName || "You"} userPhoto={me.photoUrl} pinned={pinned} />;
}

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-12">
      <Suspense fallback={null}>
        <ReferralReminder />
      </Suspense>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        {/* Left — profile */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Suspense fallback={<Skeleton h="h-96" />}>
            <ProfileSidebar />
          </Suspense>
        </aside>

        {/* Center — feed */}
        <div className="min-w-0">
          <Suspense fallback={<Skeleton h="h-64" />}>
            <FeedColumn />
          </Suspense>
        </div>

        {/* Right — rail (below feed on lg, own column on xl) */}
        <aside className="lg:col-span-2 xl:col-span-1 xl:sticky xl:top-20 xl:self-start">
          <Suspense fallback={<Skeleton h="h-80" />}>
            <RightRail />
          </Suspense>
        </aside>
      </div>
    </main>
  );
}
