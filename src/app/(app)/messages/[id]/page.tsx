import Link from "next/link";
import { notFound } from "next/navigation";
import { getConversation, getGroupInfo } from "@/lib/messaging";
import { getConnections } from "@/lib/connections";
import { getUser } from "@/lib/auth";
import { getAdminContext } from "@/lib/admin";
import Thread from "./Thread";
import GroupPanel from "./GroupPanel";

export const metadata = { title: "Conversation — Altus Tribe" };

export default async function ConversationPage({
  params,
}: PageProps<"/messages/[id]">) {
  const { id } = await params;
  const [conversation, user, adminCtx] = await Promise.all([
    getConversation(id),
    getUser(),
    getAdminContext(),
  ]);
  if (!conversation) notFound();

  // Group roster + the caller's connections (for the add-members picker) power
  // the group-info panel. Only fetched for group conversations.
  const [group, connections] =
    conversation.kind === "group"
      ? await Promise.all([getGroupInfo(id), getConnections()])
      : [null, []];

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
        <div className="min-w-0 flex-1">
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
        {conversation.kind === "group" && group && (
          <GroupPanel
            group={group}
            addable={connections.map((c) => ({
              id: c.id,
              fullName: c.fullName,
              photoUrl: c.photoUrl,
              roleTitle: c.roleTitle,
            }))}
          />
        )}
      </header>

      <Thread
        conversationId={conversation.id}
        initialMessages={conversation.messages}
        currentUserId={user?.id ?? null}
        isAdmin={adminCtx.isAdmin}
      />
    </main>
  );
}
