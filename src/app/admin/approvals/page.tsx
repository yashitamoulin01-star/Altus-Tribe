import { getPendingMembers } from "@/lib/admin";
import ApprovalActions from "./ApprovalActions";

export const metadata = { title: "Approvals — Altus Tribe Admin" };

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
}

export default async function AdminApprovalsPage() {
  const pending = await getPendingMembers();

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8 sm:px-10">
      <div>
        <p className="kicker mb-3">Approvals</p>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
          {pending.length} awaiting review
        </h1>
        <p className="mt-2 text-[15px] text-ink-secondary">
          New signups are held here until approved. Approve to grant full access;
          reject to park them as inactive.
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="mt-10 rounded border border-hairline px-4 py-12 text-center text-[15px] text-ink-secondary">
          No one is waiting. New membership requests will appear here.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded border border-hairline">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline bg-surface-sunk">
                {["Applicant", "Batch", "Industry / City", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pending.map((m) => (
                <tr key={m.id} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunk font-mono text-[11px] text-ink-muted">
                        {m.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.photoUrl} alt={m.fullName} className="h-full w-full object-cover" />
                        ) : (
                          initials(m.fullName)
                        )}
                      </span>
                      <span className="block text-[15px] font-medium text-ink">{m.fullName}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-ink-secondary">
                    {[m.cqBatch, m.psBatch].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-ink-secondary">
                    {[m.industry, m.city].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ApprovalActions
                      id={m.id}
                      reviewState={m.reviewState}
                      reviewNote={m.reviewNote}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
