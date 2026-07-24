import { getNotifications } from "@/lib/notifications";
import { Card, WidgetHeader, EmptyNote } from "./_shared";
import NotificationListWrapper from "./NotificationListWrapper";

function fmt(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Latest activity feed using React Bits AnimatedList.
export default async function NotificationsWidget() {
  const items = (await getNotifications()).slice(0, 5);

  const formattedItems = items.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    time: fmt(n.createdAt),
  }));

  return (
    <Card>
      <WidgetHeader title="Notifications" href="/notifications" />
      {items.length === 0 ? (
        <EmptyNote>You&apos;re all caught up.</EmptyNote>
      ) : (
        <NotificationListWrapper items={formattedItems} />
      )}
    </Card>
  );
}
