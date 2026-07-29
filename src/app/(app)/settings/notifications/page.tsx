import Link from "next/link";
import { getPrefs } from "@/lib/notifications";
import NotificationSettings from "./NotificationSettings";
import PushToggle from "./PushToggle";

export const metadata = { title: "Notification Settings — Altus Tribe" };

export default async function NotificationSettingsPage() {
  const prefs = await getPrefs();
  return (
    <main className="mx-auto w-full max-w-[640px] px-6 pt-8 sm:px-10">
      <nav className="mb-8">
        <Link
          href="/account"
          className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
        >
          ← You
        </Link>
      </nav>

      <header className="border-b border-hairline pb-8">
        <p className="kicker mb-3">Notification Settings</p>
        <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink md:text-3xl">
          Only what matters.
        </h1>
        <p className="mt-3 max-w-[46ch] text-[15px] leading-snug text-ink-secondary">
          Choose what the Tribe reaches you about.
        </p>
      </header>

      <div className="pt-4">
        <NotificationSettings initial={prefs} />
        <PushToggle />
      </div>

      <p className="mt-6 rounded border border-hairline bg-surface-sunk px-4 py-3 text-[14px] leading-relaxed text-ink-muted">
        Your choices save automatically. Push delivery is per-device — enable it
        on each browser where you want alerts when the app is closed.
      </p>
    </main>
  );
}
