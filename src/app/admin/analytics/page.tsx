import { getAnalytics } from "@/lib/admin-content";

export const metadata = { title: "Analytics — Altus Tribe Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const a = await getAnalytics();

  const groups: { title: string; cards: { label: string; value: number }[] }[] = [
    {
      title: "Members",
      cards: [
        { label: "Total", value: a.members },
        { label: "Active", value: a.active },
        { label: "Pending", value: a.pending },
        { label: "Hidden / inactive", value: a.hiddenInactive },
        { label: "Admins", value: a.admins },
        { label: "Consultants", value: a.consultants },
      ],
    },
    {
      title: "Engagement",
      cards: [
        { label: "Conversations", value: a.conversations },
        { label: "Messages", value: a.messages },
        { label: "Connections", value: a.connections },
      ],
    },
    {
      title: "Content",
      cards: [
        { label: "Announcements", value: a.announcements },
        { label: "Campus resources", value: a.resources },
      ],
    },
  ];

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Analytics</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">The room at a glance.</h1>

      <div className="mt-8 space-y-8">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">{g.title}</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {g.cards.map((c) => (
                <div
                  key={c.label}
                  className="group rounded-xl border border-hairline bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-hairline-bright"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">{c.label}</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-ink transition-colors group-hover:text-red">
                    {c.value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
