import Link from "next/link";
import { getNotifications } from "@/lib/notifications";
import { markAllRead } from "./actions";

export const metadata = { title: "Notifications — Altus Tribe" };

function relTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const GLYPH: Record<string, string> = {
  message: "✉",
  announcement: "◆",
  mention: "@",
  referral: "↗",
  system: "•",
};

export default async function NotificationsPage() {
  const items = await getNotifications();
  const hasUnread = items.some((n) => !n.read);

  return (
    <main className="mx-auto w-full max-w-[680px] px-6 pt-8 sm:px-10">
      <header className="flex items-end justify-between border-b border-hairline pb-6">
        <div>
          <p className="kicker mb-4">Notifications</p>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
            What you missed.
          </h1>
        </div>
        {hasUnread && (
          <form action={markAllRead}>
            <button
              type="submit"
              className="shrink-0 text-[14px] text-red transition-colors hover:text-red-hover"
            >
              Mark all read
            </button>
          </form>
        )}
      </header>

      {items.length === 0 ? (
        <p className="py-16 text-center text-[17px] text-ink-secondary">
          You&apos;re all caught up.
        </p>
      ) : (
        <ul className="divide-y divide-hairline">
          {items.map((n) => {
            const Row = (
              <div
                className={`flex gap-4 py-5 ${n.read ? "" : "-mx-4 rounded bg-surface-sunk px-4"}`}
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hairline font-mono text-[13px] text-ink-muted"
                >
                  {GLYPH[n.kind] ?? "•"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[15px] font-medium text-ink">{n.title}</p>
                    <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                      {relTime(n.createdAt)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="mt-1 text-[14px] leading-relaxed text-ink-secondary">
                      {n.body}
                    </p>
                  )}
                </div>
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red" aria-label="unread" />
                )}
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="block transition-colors hover:opacity-80">
                    {Row}
                  </Link>
                ) : (
                  Row
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-hairline py-8">
        <Link
          href="/settings/notifications"
          className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
        >
          Notification settings →
        </Link>
      </div>
    </main>
  );
}
