import Link from "next/link";
import { getNotifications } from "@/lib/notifications";
import { Card, WidgetHeader, EmptyNote } from "./_shared";

function fmt(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Latest activity feed.
export default async function NotificationsWidget() {
  const items = (await getNotifications()).slice(0, 4);

  return (
    <Card>
      <WidgetHeader title="Notifications" href="/notifications" />
      {items.length === 0 ? (
        <EmptyNote>You&apos;re all caught up.</EmptyNote>
      ) : (
        <ul className="divide-y divide-hairline">
          {items.map((n) => {
            const row = (
              <div className="flex items-start gap-3 py-3">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-hairline" : "bg-red"}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{n.title}</p>
                  {n.body && <p className="truncate text-[13px] text-ink-muted">{n.body}</p>}
                </div>
                <span className="shrink-0 font-mono text-[11px] text-ink-muted">{fmt(n.createdAt)}</span>
              </div>
            );
            return (
              <li key={n.id} className="first:[&>*]:pt-0 last:[&>*]:pb-0">
                {n.link ? <Link href={n.link}>{row}</Link> : row}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
