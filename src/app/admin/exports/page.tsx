import { getRoster } from "@/lib/admin";
import ExportBar from "./ExportBar";

export default async function AdminExportsPage() {
  const roster = await getRoster();

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Exports & outreach</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Take it with you.
      </h1>
      <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink-secondary">
        Export the master database, or reach the cohort. {roster.length} member
        {roster.length === 1 ? "" : "s"} in the current view.
      </p>

      <div className="mt-8">
        <ExportBar roster={roster} />
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-ink-muted">
        Broadcast helpers open your WhatsApp / mail composer with a starter
        message. Recipient targeting and server-side sending arrive with the
        notifications delivery service.
      </p>
    </main>
  );
}
