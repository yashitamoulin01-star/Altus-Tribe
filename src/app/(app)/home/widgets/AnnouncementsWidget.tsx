import { getAnnouncements } from "@/lib/community";
import { Card, WidgetHeader, EmptyNote } from "./_shared";

function fmt(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Latest announcements from Manan Vasa & the team (PRD Feature #4).
export default async function AnnouncementsWidget() {
  const items = (await getAnnouncements()).slice(0, 3);

  return (
    <Card>
      <WidgetHeader title="Announcements" href="/sacred-space" />
      {items.length === 0 ? (
        <EmptyNote>No announcements yet.</EmptyNote>
      ) : (
        <ul className="divide-y divide-hairline">
          {items.map((a, i) => (
            <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              {i === 0 && (
                <span className="mt-0.5 shrink-0 rounded bg-red/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-red">
                  Pinned
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-ink">{a.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-muted">
                  {a.body}
                </p>
              </div>
              <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-muted">
                {fmt(a.publishedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
