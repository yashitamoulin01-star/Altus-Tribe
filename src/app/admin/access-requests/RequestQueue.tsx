"use client";

import { useMemo, useState, useTransition } from "react";
import type { AdminRole, RequestDecision, RequestPayload, TribeStatus, ConclaveBadge } from "@/lib/access/types";
import { addNote, bulkDecide, decideRequest, resumeUrl, suspendMember } from "./actions";

export interface RequestRow {
  requestId: string;
  allowlistId: string | null;
  name: string;
  email: string;
  company: string | null;
  designation: string | null;
  location: string | null;
  badge: ConclaveBadge;
  psLinked: boolean;
  status: TribeStatus;
  decision: RequestDecision;
  requestedAt: string;
  hasResume: boolean;
  payload: RequestPayload;
  adminNotes: string | null;
  sourceDate: string;
  decidedAt: string | null;
  rejectionReason: string | null;
  whatsappHref: string | null;
  phone: string | null;
  linkedin: string | null;
}

const rel = (iso: string) => {
  const d = (Date.now() - Date.parse(iso)) / 86_400_000;
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  return `${Math.floor(d)}d ago`;
};

const STATUS_PILL: Record<TribeStatus, string> = {
  not_requested: "bg-surface-sunk text-ink-muted",
  requested: "bg-red/10 text-red",
  approved: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-ink/10 text-ink-muted",
  suspended: "bg-red/15 text-red",
};
const BADGE_CLR: Record<ConclaveBadge, string> = {
  Apr: "bg-red/10 text-red", Jul: "bg-red/10 text-red",
  Both: "bg-red text-white", "—": "bg-surface-sunk text-ink-muted",
};

export default function RequestQueue({ rows, role }: { rows: RequestRow[]; role: AdminRole }) {
  const canDecide = role === "Admin";
  const [statusF, setStatusF] = useState<"" | RequestDecision>("");
  const [sourceF, setSourceF] = useState<"" | "apr" | "jul" | "both">("");
  const [psF, setPsF] = useState<"" | "yes" | "no">("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    return rows.filter((r) => {
      if (statusF && r.decision !== statusF) return false;
      if (sourceF === "both" && r.badge !== "Both") return false;
      if (sourceF === "apr" && !(r.badge === "Apr" || r.badge === "Both")) return false;
      if (sourceF === "jul" && !(r.badge === "Jul" || r.badge === "Both")) return false;
      if (psF === "yes" && !r.psLinked) return false;
      if (psF === "no" && r.psLinked) return false;
      if (s && ![r.name, r.email, r.phone, r.company].filter(Boolean).join(" ").toLowerCase().includes(s)) return false;
      return true;
    });
  }, [rows, statusF, sourceF, psF, q]);

  const pendingIds = filtered.filter((r) => r.decision === "pending").map((r) => r.requestId);
  const allSelectedPending = selected.size > 0 && [...selected].every((id) => pendingIds.includes(id));

  const toggle = (id: string) =>
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const selectAllPending = () =>
    setSelected(() => (allSelectedPending ? new Set() : new Set(pendingIds)));

  const open = rows.find((r) => r.requestId === openId) ?? null;

  const doDecide = (requestId: string, action: "approve" | "reject", reason?: string) =>
    start(async () => {
      const r = await decideRequest({ requestId, action, rejectionReason: reason });
      setBanner(r.ok ? `Request ${action}d.` : r.error ?? "Failed.");
      if (r.ok) setOpenId(null);
    });

  const doBulk = (action: "approve" | "reject") =>
    start(async () => {
      const ids = [...selected];
      let typed = ids.length;
      if (action === "approve") {
        const n = window.prompt(`Type the number of requests to approve (${ids.length}) to confirm:`);
        if (n === null) return;
        typed = Number(n);
      }
      const r = await bulkDecide({ requestIds: ids, action, typedCount: typed });
      setBanner(r.ok ? `${r.count} request(s) ${action}d.` : r.error ?? "Failed.");
      if (r.ok) setSelected(new Set());
    });

  const exportCsv = () => {
    const head = ["name", "email", "company", "designation", "location", "conclave", "ps_linked", "status", "decision", "requested_at"];
    const lines = [head.join(",")].concat(
      filtered.map((r) => [r.name, r.email, r.company ?? "", r.designation ?? "", r.location ?? "", r.badge, r.psLinked ? "yes" : "no", r.status, r.decision, r.requestedAt]
        .map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "access-requests.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const selCls = "rounded-lg border border-hairline bg-white px-3 py-2 text-[13px] text-ink focus:border-red/40 focus:outline-none";

  return (
    <div>
      {banner && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-hairline bg-surface-sunk/60 px-4 py-2.5 text-[13px] text-ink">
          {banner}
          <button onClick={() => setBanner(null)} className="text-ink-muted hover:text-ink">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, company" className={selCls + " min-w-[240px] flex-1"} />
        <select value={statusF} onChange={(e) => setStatusF(e.target.value as "" | RequestDecision)} className={selCls}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={sourceF} onChange={(e) => setSourceF(e.target.value as "" | "apr" | "jul" | "both")} className={selCls}>
          <option value="">All sources</option>
          <option value="apr">April</option>
          <option value="jul">July</option>
          <option value="both">Both</option>
        </select>
        <select value={psF} onChange={(e) => setPsF(e.target.value as "" | "yes" | "no")} className={selCls}>
          <option value="">PS: any</option>
          <option value="yes">PS-linked</option>
          <option value="no">Not linked</option>
        </select>
        <button onClick={exportCsv} className="rounded-lg border border-hairline bg-white px-3 py-2 text-[13px] font-medium text-ink hover:border-hairline-bright">Export CSV</button>
      </div>

      {/* Bulk bar */}
      {canDecide && selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-red/20 bg-red/5 px-4 py-2.5">
          <span className="text-[13px] font-semibold text-ink">{selected.size} selected</span>
          <button disabled={pending} onClick={() => doBulk("approve")} className="rounded-lg bg-red px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-red-hover disabled:opacity-60">Bulk approve</button>
          <button disabled={pending} onClick={() => doBulk("reject")} className="rounded-lg border border-hairline bg-white px-3 py-1.5 text-[13px] font-medium text-ink hover:border-hairline-bright disabled:opacity-60">Bulk reject</button>
          <button onClick={() => setSelected(new Set())} className="text-[13px] text-ink-muted hover:text-ink">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-hairline bg-white">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-hairline text-[12px] uppercase tracking-[0.06em] text-ink-muted">
            <tr>
              {canDecide && <th className="w-10 px-4 py-3"><input type="checkbox" checked={allSelectedPending} onChange={selectAllPending} className="h-4 w-4 accent-red" aria-label="Select all pending" /></th>}
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Conclave</th>
              <th className="px-4 py-3">PS</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filtered.map((r) => (
              <tr key={r.requestId} className="hover:bg-surface-hover/50">
                {canDecide && (
                  <td className="px-4 py-3">
                    {r.decision === "pending" && <input type="checkbox" checked={selected.has(r.requestId)} onChange={() => toggle(r.requestId)} className="h-4 w-4 accent-red" aria-label={`Select ${r.name}`} />}
                  </td>
                )}
                <td className="px-4 py-3">
                  <button onClick={() => setOpenId(r.requestId)} className="font-semibold text-ink hover:text-red">{r.name}</button>
                  <div className="text-[12px] text-ink-muted">{r.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-ink">{r.company ?? "—"}</div>
                  {r.designation && <div className="text-[12px] text-ink-muted">{r.designation}</div>}
                </td>
                <td className="px-4 py-3 text-ink-secondary">{r.location ?? "—"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE_CLR[r.badge]}`}>{r.badge}</span></td>
                <td className="px-4 py-3">{r.psLinked ? <span className="text-emerald-600" title="Linked to Productivity Shastra">✓</span> : <span className="text-ink-muted">—</span>}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_PILL[r.status]}`}>{r.status.replace("_", " ")}</span></td>
                <td className="px-4 py-3 text-ink-secondary">{rel(r.requestedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setOpenId(r.requestId)} className="rounded-lg border border-hairline px-2.5 py-1 text-[12px] text-ink hover:border-hairline-bright">View</button>
                    {canDecide && r.decision === "pending" && (
                      <>
                        <button disabled={pending} onClick={() => { if (confirm(`Approve ${r.name}?`)) doDecide(r.requestId, "approve"); }} className="rounded-lg bg-red px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-red-hover disabled:opacity-60">Approve</button>
                        <button disabled={pending} onClick={() => { const reason = prompt(`Reject ${r.name}? Optional reason:`) ?? undefined; if (reason !== null || confirm(`Reject ${r.name}?`)) doDecide(r.requestId, "reject", reason); }} className="rounded-lg border border-hairline px-2.5 py-1 text-[12px] text-ink hover:border-hairline-bright disabled:opacity-60">Reject</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={canDecide ? 9 : 8} className="px-4 py-10 text-center text-[14px] text-ink-muted">No requests match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <Drawer row={open} role={role} onClose={() => setOpenId(null)} onDecide={doDecide} pending={pending} />}
    </div>
  );
}

// ── Review drawer: Profile · Documents · History · Connect ──────────────────
function Drawer({ row, role, onClose, onDecide, pending }: {
  row: RequestRow; role: AdminRole; onClose: () => void;
  onDecide: (id: string, a: "approve" | "reject", reason?: string) => void; pending: boolean;
}) {
  const canDecide = role === "Admin";
  const [tab, setTab] = useState<"profile" | "documents" | "history" | "connect">("profile");
  const [note, setNote] = useState(row.adminNotes ?? "");
  const [resume, setResume] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);
  const [, start] = useTransition();
  const initials = row.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const getResume = () => start(async () => {
    const r = await resumeUrl(row.requestId);
    setResume(r.ok ? (r.url ?? null) : (r.error ?? "Unavailable"));
  });
  const saveNote = () => { if (row.allowlistId) start(async () => { await addNote(row.allowlistId!, note); setSavedNote(true); }); };
  const doSuspend = () => { if (row.allowlistId && confirm(`Suspend ${row.name}?`)) start(async () => { await suspendMember(row.allowlistId!); onClose(); }); };

  const tabClass = (id: typeof tab) =>
    `px-3 py-2 text-[13px] font-medium ${tab === id ? "border-b-2 border-red text-red" : "text-ink-muted hover:text-ink"}`;
  const TABS: { id: typeof tab; label: string }[] = [
    { id: "profile", label: "Profile" }, { id: "documents", label: "Documents" },
    { id: "history", label: "History" }, { id: "connect", label: "Connect" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[520px] flex-col bg-paper shadow-2xl">
        {/* header */}
        <div className="flex items-start gap-4 border-b border-hairline p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red/10 text-[18px] font-bold text-red">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-bold text-ink">{row.name}</p>
            <p className="truncate text-[13px] text-ink-muted">{[row.designation, row.company].filter(Boolean).join(" @ ") || row.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_PILL[row.status]}`}>{row.status.replace("_", " ")}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE_CLR[row.badge]}`}>{row.badge}</span>
              {row.psLinked && <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">PS linked</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink" aria-label="Close">✕</button>
        </div>

        {/* tabs */}
        <div className="flex gap-1 border-b border-hairline px-3">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={tabClass(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "profile" && (
            <dl className="space-y-3 text-[14px]">
              {([
                ["Email", row.email], ["Phone", row.phone], ["Company", row.company], ["Designation", row.designation],
                ["Industry", row.payload.industry], ["Location", row.location], ["LinkedIn", row.linkedin],
                ["Connected to Altus", row.payload.connectedToAltus], ["Bio", row.payload.bio],
                ["Areas of interest", row.payload.areasOfInterest],
              ] as [string, string | null][]).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[12px] uppercase tracking-[0.06em] text-ink-muted">{k}</dt>
                  <dd className="mt-0.5 text-ink">{v || "—"}</dd>
                </div>
              ))}
            </dl>
          )}

          {tab === "documents" && (
            <div className="space-y-3">
              {row.hasResume ? (
                <>
                  <p className="text-[14px] text-ink">Resume: <span className="text-ink-muted">{row.payload.resumeFileName || "on file"}</span></p>
                  <button onClick={getResume} className="rounded-lg bg-red px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-hover">Get download link (5-min, audited)</button>
                  {resume && <p className="break-all rounded-lg border border-hairline bg-surface-sunk/60 px-3 py-2 text-[12px] text-ink-muted">{resume}</p>}
                  <p className="text-[12px] text-ink-muted">Real signed URLs require the private resumes bucket — see the readiness checklist §C.</p>
                </>
              ) : (
                <p className="text-[14px] text-ink-muted">No resume on file.</p>
              )}
            </div>
          )}

          {tab === "history" && (
            <ol className="space-y-3 border-l border-hairline pl-4 text-[13px]">
              <li><span className="text-ink-muted">Added to allowlist</span> — {row.badge === "Both" ? "April + July" : row.badge} source · {new Date(row.sourceDate).toLocaleDateString()}</li>
              <li><span className="text-ink-muted">Request submitted</span> · {new Date(row.requestedAt).toLocaleDateString()}</li>
              {row.decidedAt && <li><span className="text-ink-muted">Decision: {row.decision}</span> · {new Date(row.decidedAt).toLocaleDateString()}{row.rejectionReason ? ` — ${row.rejectionReason}` : ""}</li>}
            </ol>
          )}

          {tab === "connect" && (
            <div className="space-y-2 text-[14px]">
              {row.whatsappHref && <a href={row.whatsappHref} target="_blank" rel="noreferrer" className="block rounded-lg border border-hairline px-4 py-2.5 text-ink hover:border-hairline-bright">WhatsApp →</a>}
              {row.email && <a href={`mailto:${row.email}`} className="block rounded-lg border border-hairline px-4 py-2.5 text-ink hover:border-hairline-bright">Email {row.email}</a>}
              {row.phone && <button onClick={() => navigator.clipboard?.writeText(row.phone!)} className="block w-full rounded-lg border border-hairline px-4 py-2.5 text-left text-ink hover:border-hairline-bright">Copy phone {row.phone}</button>}
              {row.linkedin && <a href={row.linkedin.startsWith("http") ? row.linkedin : `https://${row.linkedin}`} target="_blank" rel="noreferrer" className="block rounded-lg border border-hairline px-4 py-2.5 text-ink hover:border-hairline-bright">LinkedIn →</a>}
            </div>
          )}
        </div>

        {/* action bar */}
        <div className="space-y-3 border-t border-hairline p-4">
          <div>
            <textarea value={note} onChange={(e) => { setNote(e.target.value); setSavedNote(false); }} placeholder="Internal note…" className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-[13px] text-ink focus:border-red/40 focus:outline-none" rows={2} />
            <button onClick={saveNote} className="mt-1 text-[12px] font-semibold text-red hover:underline">{savedNote ? "Saved ✓" : "Save note"}</button>
          </div>
          {canDecide ? (
            <div className="flex gap-2">
              {row.decision === "pending" && <>
                <button disabled={pending} onClick={() => onDecide(row.requestId, "approve")} className="flex-1 rounded-lg bg-red px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-red-hover disabled:opacity-60">Approve</button>
                <button disabled={pending} onClick={() => { const r = prompt("Rejection reason (optional):") ?? undefined; onDecide(row.requestId, "reject", r); }} className="flex-1 rounded-lg border border-hairline px-4 py-2.5 text-[14px] font-medium text-ink hover:border-hairline-bright disabled:opacity-60">Reject</button>
              </>}
              {row.status !== "suspended" && <button disabled={pending} onClick={doSuspend} className="rounded-lg border border-red/40 px-4 py-2.5 text-[14px] font-medium text-red hover:bg-red/5 disabled:opacity-60">Suspend</button>}
            </div>
          ) : (
            <p className="rounded-lg bg-surface-sunk/60 px-3 py-2 text-[12px] text-ink-muted">Reviewer role — you can review and add notes, but only Admins can approve, reject, or suspend.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
