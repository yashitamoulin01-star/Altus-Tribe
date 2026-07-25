import Link from "next/link";
import { getConversations } from "@/lib/messaging";

export const metadata = { title: "Groups — Altus Tribe" };
export const dynamic = "force-dynamic";

function fmt(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
}

export default async function GroupsPage() {
  const groups = (await getConversations()).filter((c) => c.kind === "group");

  return (
    <main className="mx-auto w-full max-w-[800px] px-6 pt-8 pb-28 sm:px-10">
      <header className="flex items-end justify-between gap-4 pb-6">
        <div>
          <p className="kicker mb-3 text-red font-semibold">Tribe</p>
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">Groups</h1>
          <p className="mt-2 text-[15px] text-ink-secondary">
            Instant group chat with cohorts, interest circles and business communities.
          </p>
        </div>
        <Link
          href="/messages/new"
          className="shrink-0 rounded-xl bg-red px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-red/20 transition-colors hover:bg-red-hover"
        >
          ＋ New group
        </Link>
      </header>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline px-6 py-16 text-center">
          <p className="text-[15px] font-medium text-ink">No groups yet</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            Create a group to start an instant conversation with participants.
          </p>
          <Link
            href="/messages/new"
            className="mt-5 inline-block rounded-xl bg-red px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-red-hover"
          >
            Create a group →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/messages/${g.id}`} className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-surface-hover">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-red/10 font-mono text-[13px] font-semibold text-red">
                  {g.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.avatarUrl} alt={g.title} className="h-full w-full object-cover" />
                  ) : (
                    initials(g.title) || "#"
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-ink">{g.title}</span>
                  <span className="block truncate text-[13px] text-ink-secondary">{g.snippet || "No messages yet"}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-[11px] text-ink-muted">{fmt(g.lastMessageAt)}</span>
                  {g.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red px-1 text-[11px] font-bold text-white">
                      {g.unread > 9 ? "9+" : g.unread}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Link href="/messages" className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink">
          ← All conversations
        </Link>
      </div>
    </main>
  );
}
