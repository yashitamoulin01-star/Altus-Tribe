import Link from "next/link";
import { getNotifications } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { markAllRead } from "./actions";
import NotificationsClient from "./NotificationsClient";

export const metadata = { title: "Notifications — Altus Tribe" };

export default async function NotificationsPage() {
  const [items, supabase] = await Promise.all([getNotifications(), createClient()]);
  const userId =
    (await supabase?.auth.getUser())?.data.user?.id ?? null;
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

      <NotificationsClient items={items} userId={userId} />

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
