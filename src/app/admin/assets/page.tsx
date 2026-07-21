import { getAdminContext } from "@/lib/admin";
import { getAdminAnnouncements, getAdminResources } from "@/lib/admin-content";
import AnnouncementManager from "./AnnouncementManager";
import ResourceManager from "./ResourceManager";

export const metadata = { title: "Assets — Altus Tribe Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAssetsPage() {
  const [ctx, announcements, resources] = await Promise.all([
    getAdminContext(),
    getAdminAnnouncements(),
    getAdminResources(),
  ]);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Asset Manager</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Announcements & Campus.
      </h1>
      <p className="mt-2 max-w-[52ch] text-[15px] text-ink-secondary">
        Publish notes to the Tribe and curate the learning library. Each publish
        notifies members automatically.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-red">Announcements</h2>
          <AnnouncementManager items={announcements} />
        </section>
        <section>
          <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-red">Campus resources</h2>
          <ResourceManager items={resources} userId={ctx.userId} />
        </section>
      </div>
    </main>
  );
}
