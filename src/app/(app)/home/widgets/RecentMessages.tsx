import { getConversations } from "@/lib/messaging";
import { Card, WidgetHeader, EmptyNote } from "./_shared";
import RecentMessagesWrapper from "./RecentMessagesWrapper";

// Latest chats (PRD Features #1 & #2) powered by React Bits AnimatedList.
export default async function RecentMessages() {
  const convos = (await getConversations()).slice(0, 4);

  return (
    <Card>
      <WidgetHeader title="Recent messages" href="/messages" />
      {convos.length === 0 ? (
        <EmptyNote>No conversations yet.</EmptyNote>
      ) : (
        <RecentMessagesWrapper convos={convos} />
      )}
    </Card>
  );
}

