import { getResources } from "@/lib/community";
import { Card, WidgetHeader, EmptyNote } from "./_shared";

// Inspiration Corner — daily wins & stories (PRD Feature #5).
export default async function InspirationWidget() {
  const items = (await getResources("inspiration")).slice(0, 3);

  return (
    <Card>
      <WidgetHeader title="Inspiration Corner" href="/campus" />
      {items.length === 0 ? (
        <EmptyNote>Fresh inspiration is on the way.</EmptyNote>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id}>
              <p className="text-[15px] font-medium leading-snug text-ink">{r.title}</p>
              {r.description && (
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-muted">
                  {r.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
