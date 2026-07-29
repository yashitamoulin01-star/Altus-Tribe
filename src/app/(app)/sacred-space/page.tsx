import Link from "next/link";
import { getAnnouncements, getResources } from "@/lib/community";
import { getConversations } from "@/lib/messaging";
import AskManan from "./AskManan";

export const metadata = { title: "Sacred Space — Altus Tribe" };
export const dynamic = "force-dynamic";

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default async function SacredSpacePage() {
  const [announcements, conversations, resources] = await Promise.all([
    getAnnouncements(),
    getConversations(),
    getResources("inspiration"),
  ]);
  const queries = conversations.filter((c) => c.kind === "support");

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 pt-6 pb-16 sm:px-10">
      <header className="border-b border-hairline pb-6">
        <p className="kicker mb-3">Sacred Space</p>
        <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink md:text-3xl">
          From Manan Vasa.
        </h1>
        <p className="mt-3 max-w-[46ch] text-[15px] leading-snug text-ink-secondary">
          Ask the team anything, and read the notes from the leader of the Tribe.
        </p>
        <AskManan />
      </header>

      {/* Query history */}
      {queries.length > 0 && (
        <section className="border-b border-hairline py-6">
          <p className="kicker mb-3">Your queries</p>
          <ul className="divide-y divide-hairline">
            {queries.map((c) => (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-surface-hover">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-ink">{c.title}</p>
                    <p className="truncate text-[13px] text-ink-muted">{c.snippet || "No messages yet"}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-ink-muted">{fmtDate(c.lastMessageAt)}</span>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red px-1.5 text-[11px] font-medium text-paper">
                      {c.unread > 9 ? "9+" : c.unread}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Announcements */}
      <section className="pt-6">
        <p className="kicker mb-3">Announcements</p>
        <div className="divide-y divide-hairline">
          {announcements.map((a, i) => (
            <article key={a.id} className="py-5">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tabular-nums text-red">{String(i + 1).padStart(2, "0")}</span>
                {a.publishedAt && <span className="kicker">{fmtDate(a.publishedAt)}</span>}
                {a.pinnedAt && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-red">★ Pinned</span>
                )}
              </div>
              <h2 className="mt-2 text-lg font-semibold leading-tight tracking-[-0.015em] text-ink">{a.title}</h2>
              {a.body && <p className="mt-1.5 text-[15px] leading-relaxed text-ink-secondary">{a.body}</p>}
            </article>
          ))}
          {announcements.length === 0 && (
            <p className="py-8 text-center text-[15px] text-ink-secondary">
              No announcements yet. This space stays quiet until it matters.
            </p>
          )}
        </div>
      </section>

      {/* Resources */}
      {resources.length > 0 && (
        <section className="border-t border-hairline py-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="kicker">Resources</p>
            <Link href="/campus" className="text-[13px] text-red transition-colors hover:text-red-hover">
              All of Campus →
            </Link>
          </div>
          <ul className="space-y-3">
            {resources.slice(0, 4).map((r) => (
              <li key={r.id}>
                <Link href={`/campus/${r.id}`} className="group block rounded-xl border border-hairline bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-hairline-bright">
                  <p className="text-[15px] font-medium text-ink transition-colors group-hover:text-red">{r.title}</p>
                  {r.description && <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">{r.description}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
