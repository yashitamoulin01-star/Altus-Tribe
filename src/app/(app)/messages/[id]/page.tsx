import Link from "next/link";
import { notFound } from "next/navigation";
import { getConversation } from "@/lib/messaging";
import { getUser } from "@/lib/auth";
import Thread from "./Thread";

export const metadata = { title: "Conversation — Altus Tribe" };

export default async function ConversationPage({
  params,
}: PageProps<"/messages/[id]">) {
  const { id } = await params;
  const [conversation, user] = await Promise.all([getConversation(id), getUser()]);
  if (!conversation) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col px-6 sm:px-10">
      {/* Thread header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-hairline bg-paper py-4 lg:top-14">
        <Link
          href="/messages"
          aria-label="Back to messages"
          className="font-mono text-ink-muted transition-colors hover:text-ink"
        >
          ←
        </Link>
        <div className="min-w-0">
          <p className="truncate text-[16px] font-medium text-ink">
            {conversation.title}
          </p>
          <p className="truncate font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
            {conversation.kind === "group"
              ? `${conversation.memberNames.length} members`
              : conversation.kind === "support"
                ? "Sacred Space"
                : "Direct message"}
          </p>
        </div>
      </header>

      <Thread
        conversationId={conversation.id}
        initialMessages={conversation.messages}
        currentUserId={user?.id ?? null}
      />
    </main>
  );
}
