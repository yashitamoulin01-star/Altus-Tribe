import { getAllTaxonomies, TAXONOMY_KINDS } from "@/lib/admin-content";
import TaxonomyManager from "./TaxonomyManager";

export const metadata = { title: "Categories — Altus Tribe Admin" };
export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  industry: "Industries",
  category: "Categories",
  city: "Cities",
  state: "States",
  country: "Countries",
};

export default async function AdminTaxonomiesPage() {
  const all = await getAllTaxonomies();

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Categories</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Directory taxonomy.
      </h1>
      <p className="mt-2 max-w-[52ch] text-[15px] text-ink-secondary">
        These values populate the profile-builder dropdowns and the Explore
        filters. Add what the Tribe needs; remove what it doesn&apos;t. Existing
        member entries are never changed — only the pick-lists.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {TAXONOMY_KINDS.map((kind) => (
          <TaxonomyManager
            key={kind}
            kind={kind}
            label={KIND_LABELS[kind] ?? kind}
            items={all.filter((t) => t.kind === kind)}
          />
        ))}
      </div>
    </main>
  );
}
