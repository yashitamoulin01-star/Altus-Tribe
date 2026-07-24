import Link from "next/link";
import { getConversations } from "@/lib/messaging";
import { Card, WidgetHeader, Avatar, EmptyNote } from "./_shared";

// Latest chats (PRD Features #1 & #2).
export default async function RecentMessages() {
  const convos = (await getConversations()).slice(0, 4);

  return (
    <Card>
      <WidgetHeader title="Recent messages" href="/messages" />
      {convos.length === 0 ? (
        <EmptyNote>No conversations yet.</EmptyNote>
      ) : (
        <ul className="divide-y divide-hairline">
          {convos.map((c) => (
            <li key={c.id}>
              <Link href={`/messages/${c.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar url={c.avatarUrl} name={c.title} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink">{c.title}</p>
                  <p className="truncate text-[13px] text-ink-muted">{c.snippet}</p>
                </div>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red px-1.5 text-[11px] font-medium text-paper">
                    {c.unread > 9 ? "9+" : c.unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

