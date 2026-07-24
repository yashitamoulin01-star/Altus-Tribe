import { getAllSettings } from "@/lib/settings";
import SettingsManager from "./SettingsManager";

export const metadata = { title: "Settings — Altus Tribe Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();

  return (
    <main className="mx-auto w-full max-w-[900px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Settings</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Content control.
      </h1>
      <p className="mt-2 max-w-[56ch] text-[15px] text-ink-secondary">
        Operational links and featured content members see — change them here, no
        deploy needed. These are public; internal routes stay in code.
      </p>

      <div className="mt-8">
        <SettingsManager initial={settings} />
      </div>
    </main>
  );
}
