import Link from "next/link";
import { getConversations } from "@/lib/messaging";

export const metadata = { title: "Messages — Altus Tribe" };

function relTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

export default async function MessagesPage() {
  const conversations = await getConversations();

  return (
    <main className="mx-auto w-full max-w-[800px] px-6 pt-8 pb-28 sm:px-10 space-y-8">
      <header className="border-b border-hairline/80 pb-6">
        <p className="kicker mb-2 text-red font-semibold">Tribe Messaging</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Direct Conversations
        </h1>
        <p className="mt-2 text-[14px] text-ink-secondary">
          Private 1:1 and group communications with fellow Tribe members.
        </p>
      </header>

      {conversations.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-hairline rounded-2xl bg-surface/40">
          <p className="text-3xl mb-3">💬</p>
          <p className="text-[16px] font-semibold text-ink">No conversations yet</p>
          <p className="mt-1 text-[13px] text-ink-muted mb-4">
            Visit a member&apos;s feature page or explore the directory to start a chat.
          </p>
          <Link href="/explore" className="inline-block rounded-xl bg-red px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover">
            Browse Directory →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-hairline/80 bg-surface/80 p-2 backdrop-blur-md">
          <ul className="divide-y divide-hairline/60">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-surface-hover/80 group"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-hairline bg-surface-sunk shadow-inner">
                    {c.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatarUrl} alt={c.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-mono text-[13px] font-semibold text-ink-muted">
                        {initials(c.title)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[15px] font-semibold text-ink transition-colors group-hover:text-red">
                        {c.title}
                        {c.kind === "support" && (
                          <span className="ml-2 rounded-full bg-red/10 px-2 py-0.5 align-middle font-mono text-[9px] uppercase tracking-[0.1em] text-red font-semibold">
                            Sacred Space
                          </span>
                        )}
                      </p>
                      <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                        {relTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[13px] text-ink-secondary">
                      {c.snippet || "No messages yet"}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red px-2 text-[11px] font-bold text-white shadow-md shadow-red/30">
                      {c.unread}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

