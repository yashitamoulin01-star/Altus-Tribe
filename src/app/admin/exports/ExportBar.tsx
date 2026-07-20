"use client";

import type { RosterMember } from "@/lib/admin";

// Exports & outreach (#176–179). Excel/CSV + PDF (print) of the master DB, plus
// WhatsApp / Email compose helpers. All client-side — no server send in P6.
export default function ExportBar({ roster }: { roster: RosterMember[] }) {
  const downloadCsv = () => {
    const headers = ["Name", "Slug", "Role", "Status", "City", "Industry", "CQ Batch", "PS Batch"];
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      headers.join(","),
      ...roster.map((m) =>
        [m.fullName, m.slug, m.role, m.status, m.city ?? "", m.industry ?? "", m.cqBatch ?? "", m.psBatch ?? ""]
          .map(esc)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `altus-tribe-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const whatsapp = () =>
    window.open(
      `https://wa.me/?text=${encodeURIComponent("A note for the Altus Tribe:\n\n")}`,
      "_blank",
      "noopener,noreferrer",
    );

  const email = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent("Altus Tribe")}&body=${encodeURIComponent("A note for the Tribe:\n\n")}`;
  };

  const btn =
    "rounded border border-hairline px-5 py-3 text-[15px] text-ink transition-colors hover:border-ink-muted";

  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" className={btn} onClick={downloadCsv}>
        Download Excel (CSV)
      </button>
      <button type="button" className={btn} onClick={() => window.print()}>
        Download PDF
      </button>
      <button type="button" className={btn} onClick={whatsapp}>
        WhatsApp members
      </button>
      <button type="button" className={btn} onClick={email}>
        Email members
      </button>
    </div>
  );
}
