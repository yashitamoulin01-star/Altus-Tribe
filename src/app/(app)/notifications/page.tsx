import Link from "next/link";
import { getNotifications } from "@/lib/notifications";
import { markAllRead } from "./actions";
import NotificationsClient from "./NotificationsClient";

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
        <NotificationsClient items={items} />
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
