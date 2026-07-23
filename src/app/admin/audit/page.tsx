import { getAuditLog } from "@/lib/admin-content";

export const metadata = { title: "Audit Log — Altus Tribe Admin" };
export const dynamic = "force-dynamic";

// Human-readable labels for the audit action codes.
const ACTION_LABELS: Record<string, string> = {
  "member.status": "Changed member status",
  "member.approve": "Approved member",
  "member.reject": "Rejected member",
  "member.delete": "Deleted member",
  "member.role": "Changed member role",
  "member.assign_consultant": "Assigned consultant",
  "message.delete": "Removed message",
  "asset.announcement.create": "Published announcement",
  "asset.announcement.delete": "Deleted announcement",
  "asset.resource.create": "Added Campus resource",
  "asset.resource.delete": "Deleted Campus resource",
};

function relTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminAuditPage() {
  const entries = await getAuditLog();

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Audit Log</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">Who did what.</h1>
      <p className="mt-2 max-w-[52ch] text-[15px] text-ink-secondary">
        An immutable trail of security-sensitive admin actions. Newest first.
      </p>

      {entries.length === 0 ? (
        <p className="mt-10 text-[15px] text-ink-muted">
          No activity recorded yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-hairline">
          {entries.map((e) => {
            const meta = Object.entries(e.metadata).filter(([, v]) => v !== null && v !== "");
            return (
              <li key={e.id} className="-mx-3 flex items-start justify-between gap-4 rounded-lg px-3 py-3.5 transition-colors hover:bg-surface-hover">
                <div className="min-w-0">
                  <p className="text-[15px] text-ink">
                    <span className="font-medium">{e.actorName ?? "Someone"}</span>{" "}
                    <span className="text-ink-secondary">
                      {ACTION_LABELS[e.action] ?? e.action}
                    </span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-ink-muted">
                    {e.entityType && (
                      <span>
                        {e.entityType}
                        {e.entityId ? `:${e.entityId.slice(0, 8)}` : ""}
                      </span>
                    )}
                    {meta.map(([k, v]) => (
                      <span key={k}>
                        {k}={String(v)}
                      </span>
                    ))}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                  {relTime(e.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
