import { getResources } from "@/lib/community";
import { Card, WidgetHeader, EmptyNote } from "./_shared";

// Campus preview — recently uploaded videos (PRD Feature #6).
export default async function CampusWidget() {
  const videos = (await getResources("video")).slice(0, 3);

  return (
    <Card>
      <WidgetHeader title="From Campus" href="/campus" />
      {videos.length === 0 ? (
        <EmptyNote>New videos are on the way.</EmptyNote>
      ) : (
        <ul className="space-y-3">
          {videos.map((v) => (
            <li key={v.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunk text-ink-muted" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-ink">{v.title}</p>
                {v.description && (
                  <p className="line-clamp-1 text-[13px] text-ink-muted">{v.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
