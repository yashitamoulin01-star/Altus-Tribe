"use client";

import { useState, useTransition } from "react";
import { saveCrm, assignConsultant } from "../../actions";
import type { CrmImpact, CrmRecord, RatingTier } from "@/lib/crm";
import type { RosterMember } from "@/lib/admin";

const RATINGS: RatingTier[] = [
  "ambassador", "mentor", "coach", "expert", "practitioner", "observer",
];

const IMPACT_FIELDS: { key: keyof CrmImpact; label: string }[] = [
  { key: "testimonial", label: "One-line testimonial (A10)" },
  { key: "turnover", label: "Increase in turnover (A13)" },
  { key: "tangible", label: "Tangible gains (A14)" },
  { key: "kpi_time", label: "Time spent on KPIs (A15)" },
  { key: "productivity", label: "Increase in productivity (A16)" },
  { key: "time_saved", label: "Increase in time saved (A17)" },
  { key: "delegation", label: "Getting work done from others (A18)" },
  { key: "work_life", label: "Better work-life balance (A19)" },
  { key: "habits", label: "Change in habits (A20)" },
];

const field =
  "w-full rounded border border-hairline bg-surface-sunk px-3 py-2 text-[14px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none";
const labelCls = "mb-1 block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted";

export default function CrmEditor({
  record,
  consultants,
  isAdmin,
}: {
  record: CrmRecord;
  consultants: RosterMember[];
  isAdmin: boolean;
}) {
  const [form, setForm] = useState<CrmRecord>(record);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof CrmRecord>(key: K, value: CrmRecord[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };
  const setImpact = (key: keyof CrmImpact, value: string) => {
    setForm((f) => ({ ...f, impact: { ...f.impact, [key]: value } }));
    setSaved(false);
  };

  const save = () =>
    startTransition(async () => {
      await saveCrm({
        profileId: form.profileId,
        referredBy: form.referredBy,
        breakthrough: form.breakthrough,
        upsellPossible: form.upsellPossible,
        rating: form.rating,
        impact: form.impact,
      });
      setSaved(true);
    });

  const reassign = (consultantId: string) =>
    startTransition(async () => {
      await assignConsultant(form.profileId, consultantId || null);
      set("designatedConsultant", consultantId || null);
    });

  return (
    <div className="space-y-8">
      {/* Attribution */}
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelCls}>Referred by (A1)</label>
          <input className={field} value={form.referredBy} onChange={(e) => set("referredBy", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Designated consultant (A11)</label>
          <select
            className={field}
            value={form.designatedConsultant ?? ""}
            onChange={(e) => reassign(e.target.value)}
            disabled={!isAdmin}
          >
            <option value="">— Unassigned —</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </select>
          {!isAdmin && (
            <p className="mt-1 text-[12px] text-ink-muted">Only admins can reassign.</p>
          )}
        </div>
      </section>

      <div>
        <label className={labelCls}>Participant breakthrough (A2)</label>
        <textarea
          className={`${field} min-h-24 resize-y`}
          value={form.breakthrough}
          onChange={(e) => set("breakthrough", e.target.value)}
        />
      </div>

      {/* Rating + upsell */}
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelCls}>Participant rating (A22)</label>
          <select
            className={field}
            value={form.rating ?? ""}
            onChange={(e) => set("rating", (e.target.value || null) as RatingTier | null)}
            disabled={!isAdmin}
          >
            <option value="">— Unrated —</option>
            {RATINGS.map((r) => (
              <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-3 self-end pb-2">
          <input
            type="checkbox"
            checked={form.upsellPossible}
            onChange={(e) => set("upsellPossible", e.target.checked)}
            className="h-4 w-4 accent-[var(--color-red)]"
          />
          <span className="text-[14px] text-ink">Upsell possible (A12)</span>
        </label>
      </section>

      {/* Impact metrics */}
      <section>
        <p className="kicker mb-3">Impact (A13–A20)</p>
        <div className="grid gap-3 md:grid-cols-2">
          {IMPACT_FIELDS.map((f) => (
            <div key={f.key}>
              <label className={labelCls}>{f.label}</label>
              <input
                className={field}
                value={form.impact[f.key] ?? ""}
                onChange={(e) => setImpact(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-hairline pt-5">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded bg-red px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save CRM"}
        </button>
        {saved && <span className="text-[13px] text-positive">Saved ✓</span>}
      </div>
    </div>
  );
}
