import Link from "next/link";
import NotificationSettings from "./NotificationSettings";

export const metadata = { title: "Notification Settings — Altus Tribe" };

export default function NotificationSettingsPage() {
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
        <p className="kicker mb-4">Notification Settings</p>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
          Only what matters.
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg leading-snug text-ink-secondary">
          Choose what the Tribe reaches you about.
        </p>
      </header>

      <div className="pt-4">
        <NotificationSettings />
      </div>

      <p className="mt-6 rounded border border-hairline bg-surface-sunk px-4 py-3 text-[14px] leading-relaxed text-ink-muted">
        Delivery to your device (push notifications) turns on in a coming update.
        Your choices here will carry over.
      </p>
    </main>
  );
}
