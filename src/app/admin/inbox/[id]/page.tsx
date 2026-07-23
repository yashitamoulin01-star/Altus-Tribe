import Link from "next/link";
import { notFound } from "next/navigation";
import { getConversation } from "@/lib/messaging";
import { getUser } from "@/lib/auth";
import { getAdminContext } from "@/lib/admin";
import { joinSupportThread } from "@/app/admin/actions";
import Thread from "@/app/(app)/messages/[id]/Thread";

export const metadata = { title: "Support thread — Altus Tribe Admin" };
export const dynamic = "force-dynamic";

export default async function AdminInboxThreadPage({
  params,
}: PageProps<"/admin/inbox/[id]">) {
  const { id } = await params;

  // Ensure the current admin is a member first, so they can reply (the messages
  // INSERT policy requires membership). Idempotent; no-op if already a member.
  await joinSupportThread(id);

  const [conversation, user, adminCtx] = await Promise.all([
    getConversation(id),
    getUser(),
    getAdminContext(),
  ]);
  if (!conversation || !adminCtx.isAdmin) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col px-6 sm:px-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-hairline bg-paper py-4 lg:top-14">
        <Link
          href="/admin/inbox"
          aria-label="Back to inbox"
          className="font-mono text-ink-muted transition-colors hover:text-ink"
        >
          ←
        </Link>
        <div className="min-w-0">
          <p className="truncate text-[16px] font-medium text-ink">
            {conversation.title}
          </p>
          <p className="truncate font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
            Sacred Space · team reply
          </p>
        </div>
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
