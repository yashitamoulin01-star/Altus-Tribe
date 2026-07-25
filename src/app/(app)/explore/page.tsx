import Link from "next/link";
import { getAllMembers } from "@/lib/members-data";
import { getConnectionMap, getIncomingRequestCount } from "@/lib/connections";
import { getSuggestedMembers } from "@/lib/dashboard";
import { getUser } from "@/lib/auth";
import ExploreGallery from "./ExploreGallery";

export const metadata = { title: "Explore People — Altus Tribe" };
export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] ?? "" : sp.q ?? "";

  const [members, connMap, recommended, viewer, requestCount] = await Promise.all([
    getAllMembers(),
    getConnectionMap(),
    getSuggestedMembers(8),
    getUser(),
    getIncomingRequestCount(),
  ]);

  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 sm:px-10">
      <nav className="flex items-center justify-between py-6">
        <Link
          href="/home"
          className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
        >
          ← Altus Tribe
        </Link>
        <Link
          href="/connections"
          className="text-[14px] text-ink-muted transition-colors hover:text-ink"
        >
          Requests
          {requestCount > 0 && (
            <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-medium text-paper">
              {requestCount > 9 ? "9+" : requestCount}
            </span>
          )}
        </Link>
      </nav>

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

      <ExploreGallery
        members={members}
        connectionMap={Object.fromEntries(connMap)}
        currentUserId={viewer?.id ?? null}
        recommendedSlugs={recommended.map((m) => m.slug)}
        initialQuery={q}
      />
    </main>
  );
}
