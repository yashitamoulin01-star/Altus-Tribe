"use client";

import { useMemo, useState, useTransition } from "react";
import { recordCrmShare } from "../../actions";
import { CRM_ASSET_FIELDS, CLASSIFICATIONS } from "@/lib/crm-fields";
import type { CrmAsset, CrmRecord } from "@/lib/crm";

// A1–A22 share composer (docs/17 §C). Admin selects shareable snippets → previews
// a composed message → picks WhatsApp or Email → confirms → the audit event is
// recorded server-side and the admin's own wa.me / mailto client opens. HONEST:
// no automated delivery, and private evidence IMAGES are never auto-attached
// (wa.me/mailto can't carry files, and signed URLs expire) — text + external
// links only.

type Snippet = { key: string; label: string; value: string };

const IMPACT_LABELS: Record<string, string> = {
  testimonial: "Testimonial (A10)",
  turnover: "Increase in turnover (A13)",
  tangible: "Tangible gains (A14)",
  kpi_time: "Time on KPIs (A15)",
  productivity: "Increase in productivity (A16)",
  time_saved: "Time saved (A17)",
  delegation: "Work done through others (A18)",
  work_life: "Work–life balance (A19)",
  habits: "Change in habits (A20)",
};

function buildSnippets(record: CrmRecord, assets: CrmAsset[]): Snippet[] {
  const out: Snippet[] = [];
  const push = (key: string, label: string, value?: string | null) => {
    if (value && value.trim()) out.push({ key, label, value: value.trim() });
  };

  push("a1", "Referred by (A1)", record.referredBy);
  push("a2", "Breakthrough (A2)", record.breakthrough);
  if (record.classifications.length) {
    const labels = record.classifications
      .map((v) => CLASSIFICATIONS.find((c) => c.value === v)?.label ?? v)
      .join(", ");
    push("a22", "Classification (A22)", labels);
  }
  for (const [k, label] of Object.entries(IMPACT_LABELS)) {
    push(`impact.${k}`, label, record.impact[k as keyof typeof record.impact]);
  }
  // Assets: shareable text bodies and external links only (never private images).
  for (const f of CRM_ASSET_FIELDS) {
    const a = assets.find((x) => x.kind === f.kind);
    if (!a) continue;
    if (f.text) push(`${f.kind}.body`, f.label, a.body);
    if (f.link) push(`${f.kind}.url`, f.label, a.url);
  }
  return out;
}

export default function ShareComposer({
  participantId,
  memberName,
  record,
  assets,
}: {
  participantId: string;
  memberName: string;
  record: CrmRecord;
  assets: CrmAsset[];
}) {
  const snippets = useMemo(() => buildSnippets(record, assets), [record, assets]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [recipient, setRecipient] = useState("");
  const [edited, setEdited] = useState<string | null>(null); // null = auto-composed
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const composed = useMemo(() => {
    const lines = snippets
      .filter((s) => selected.has(s.key))
      .map((s) => `${s.label}\n${s.value}`);
    const header = `Altus Tribe — ${memberName}`;
    return lines.length ? `${header}\n\n${lines.join("\n\n")}` : header;
  }, [snippets, selected, memberName]);

  const message = edited ?? composed;

  const toggle = (key: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setEdited(null); // re-sync preview to the new selection
    setDone(false);
  };

  const recipientValid =
    channel === "whatsapp"
      ? recipient.replace(/[^0-9]/g, "").length >= 8
      : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient.trim());

  const canShare = selected.size > 0 && recipientValid && !pending;

  const share = () => {
    if (!canShare) return;
    startTransition(async () => {
      await recordCrmShare({
        participantId,
        channel,
        recipient,
        fields: Array.from(selected),
      });
      const text = encodeURIComponent(message);
      let url: string;
      if (channel === "whatsapp") {
        url = `https://wa.me/${recipient.replace(/[^0-9]/g, "")}?text=${text}`;
      } else {
        const subject = encodeURIComponent(`Altus Tribe — ${memberName}`);
        url = `mailto:${recipient.trim()}?subject=${subject}&body=${text}`;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      setDone(true);
    });
  };

  const inputCls =
    "w-full rounded border border-hairline bg-surface-sunk px-3 py-2 text-[14px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none";

  if (!snippets.length) {
    return (
      <p className="text-[13px] text-ink-muted">
        Nothing to share yet — add referral, breakthrough, impact or asset details above first.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-hairline px-4 py-2 text-[13px] text-ink transition-colors hover:border-ink-muted"
      >
        Share intelligence…
      </button>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-hairline bg-surface p-5">
      {/* 1. Select */}
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
          Select what to share
        </p>
        <div className="flex flex-wrap gap-2">
          {snippets.map((s) => {
            const on = selected.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(s.key)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/40 ${
                  on
                    ? "border-red bg-red text-paper"
                    : "border-hairline bg-surface-sunk text-ink-muted hover:border-ink-muted hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[12px] text-ink-muted">
          Private evidence images aren&apos;t attachable via WhatsApp/email — text &amp; links only.
        </p>
      </div>

      {/* 2. Preview */}
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">Preview</p>
        <textarea
          className={`${inputCls} min-h-32 resize-y font-mono text-[13px]`}
          value={message}
          onChange={(e) => {
            setEdited(e.target.value);
            setDone(false);
          }}
          aria-label="Message preview — editable"
        />
      </div>

      {/* 3. Channel + recipient */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">Channel</p>
          <div className="flex gap-2">
            {(["whatsapp", "email"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setChannel(c);
                  setDone(false);
                }}
                aria-pressed={channel === c}
                className={`flex-1 rounded border px-3 py-2 text-[13px] font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/40 ${
                  channel === c
                    ? "border-red bg-red text-paper"
                    : "border-hairline text-ink-muted hover:border-ink-muted hover:text-ink"
                }`}
              >
                {c === "whatsapp" ? "WhatsApp" : "Email"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
            {channel === "whatsapp" ? "Recipient number" : "Recipient email"}
          </p>
          <input
            className={inputCls}
            type={channel === "whatsapp" ? "tel" : "email"}
            inputMode={channel === "whatsapp" ? "tel" : "email"}
            placeholder={channel === "whatsapp" ? "e.g. 919812345678" : "name@example.com"}
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              setDone(false);
            }}
          />
        </div>
      </div>

      {/* 4. Confirm + share */}
      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <button
          type="button"
          onClick={share}
          disabled={!canShare}
          className="rounded bg-red px-5 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
        >
          {pending ? "Opening…" : `Confirm & open ${channel === "whatsapp" ? "WhatsApp" : "email"}`}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border border-hairline px-4 py-2 text-[13px] text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
        >
          Close
        </button>
        <span className="text-[12px] text-ink-muted">
          {done
            ? "✓ Recorded — your app opened to send."
            : "Altus doesn't send automatically; your own app opens."}
        </span>
      </div>
    </div>
  );
}
