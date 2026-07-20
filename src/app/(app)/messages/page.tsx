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
    <main className="mx-auto w-full max-w-[760px] px-6 pt-8 sm:px-10">
      <header className="border-b border-hairline pb-6">
        <p className="kicker mb-4">Messages</p>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
          The conversation.
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg leading-snug text-ink-secondary">
          Direct lines to the people you meet in the Tribe.
        </p>
      </header>

      {conversations.length === 0 ? (
        <p className="py-16 text-center text-[17px] text-ink-secondary">
          No conversations yet. Start one from a member&apos;s feature.
        </p>
      ) : (
        <ul className="divide-y divide-hairline">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className="flex items-center gap-4 py-4 transition-colors hover:bg-surface-sunk"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunk">
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatarUrl} alt={c.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-mono text-[13px] text-ink-muted">
                      {initials(c.title)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[16px] font-medium text-ink">
                      {c.title}
                      {c.kind === "support" && (
                        <span className="ml-2 rounded bg-red/10 px-1.5 py-0.5 align-middle font-mono text-[10px] uppercase tracking-[0.1em] text-red">
                          Sacred
                        </span>
                      )}
                    </p>
                    <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                      {relTime(c.lastMessageAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[14px] text-ink-secondary">
                    {c.snippet}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red px-1.5 text-[11px] font-medium text-paper">
                    {c.unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
