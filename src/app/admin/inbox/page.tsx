import Link from "next/link";
import { getSupportConversations } from "@/lib/admin";

export const metadata = { title: "Sacred Space Inbox — Altus Tribe Admin" };
export const dynamic = "force-dynamic";

function relTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
}

export default async function AdminInboxPage() {
  const threads = await getSupportConversations();

  return (
    <main className="mx-auto w-full max-w-[900px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Sacred Space</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Team inbox
      </h1>
      <p className="mt-2 max-w-[60ch] text-[15px] text-ink-secondary">
        In-app support threads members opened with the team. Most members now reach
        the team on WhatsApp, so this holds any conversations started inside the app.
      </p>

      {threads.length === 0 ? (
        <p className="mt-10 rounded-xl border border-hairline px-4 py-12 text-center text-[15px] text-ink-secondary">
          No in-app support threads. New ones will appear here.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-hairline rounded-xl border border-hairline">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/admin/inbox/${t.id}`}
                className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-hover"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-sunk font-mono text-[11px] text-ink-muted">
                  {initials(t.memberName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink">{t.memberName}</span>
                  <span className="block truncate text-[13px] text-ink-muted">
                    {t.snippet || "No messages yet"}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                  {relTime(t.lastMessageAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
