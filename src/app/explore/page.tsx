import Link from "next/link";
import { getAllMembers } from "@/lib/members-data";
import ExploreGallery from "./ExploreGallery";

export default async function ExplorePage() {
  const members = await getAllMembers();

  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 sm:px-10">
      {/* Minimal top bar — one back affordance */}
      <nav className="flex items-center justify-between py-6">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
        >
          ← Altus Tribe
        </Link>
      </nav>

      {/* Header */}
      <header className="pb-2 pt-4">
        <p className="kicker mb-5">Explore People</p>
        <h1 className="max-w-[16ch] text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
          People worth knowing.
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg leading-snug text-ink-secondary">
          Every member here was invited. Search the room, or let a filter narrow
          it down.
        </p>
      </header>

      <ExploreGallery members={members} />
    </main>
  );
}
