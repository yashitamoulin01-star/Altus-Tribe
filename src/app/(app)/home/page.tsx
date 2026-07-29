import { Suspense } from "react";
import HomeDashboard from "./HomeDashboard";

export const metadata = { title: "Home — Altus Tribe" };

// Home — the professional operating system. Scan order: KPIs → Networking →
// Opportunities → Activity. Altus palette; designed for a 14" laptop.
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-12">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl border border-hairline bg-surface-sunk/50" />}>
        <HomeDashboard />
      </Suspense>
    </main>
  );
}
