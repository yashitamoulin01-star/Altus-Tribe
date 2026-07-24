"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveCrm, saveCrmAssets, assignConsultant } from "../../actions";
import { CRM_ASSET_FIELDS, CLASSIFICATIONS } from "@/lib/crm-fields";
import { uploadFile } from "@/lib/storage-client";
import type { CrmAsset, CrmImpact, CrmRecord } from "@/lib/crm";
import type { RosterMember } from "@/lib/admin";

// Editor-local asset slot: the possible inputs for one A-code. `image` is the
// canonical storage path (or pasted URL); `imageUrl` is the read-only signed URL
// used only to preview an already-saved private image.
type AssetSlot = { body: string; url: string; image: string; imageUrl: string | null };

function initSlots(assets: CrmAsset[]): Record<string, AssetSlot> {
  const out: Record<string, AssetSlot> = {};
  for (const f of CRM_ASSET_FIELDS) {
    const hit = assets.find((a) => a.kind === f.kind);
    out[f.kind] = {
      body: hit?.body ?? "",
      url: hit?.url ?? "",
      image: hit?.image ?? "",
      imageUrl: hit?.imageUrl ?? null,
    };
  }
  return out;
}

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
  assets,
  consultants,
  isAdmin,
}: {
  record: CrmRecord;
  assets: CrmAsset[];
  consultants: RosterMember[];
  isAdmin: boolean;
}) {
  const [form, setForm] = useState<CrmRecord>(record);
  const [slots, setSlots] = useState<Record<string, AssetSlot>>(() =>
    initSlots(assets),
  );
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const set = <K extends keyof CrmRecord>(key: K, value: CrmRecord[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setStatus("idle");
  };
  const setImpact = (key: keyof CrmImpact, value: string) => {
    setForm((f) => ({ ...f, impact: { ...f.impact, [key]: value } }));
    setStatus("idle");
  };
  const setSlot = (kind: string, patch: Partial<AssetSlot>) => {
    setSlots((s) => ({ ...s, [kind]: { ...s[kind], ...patch } }));
    setStatus("idle");
  };
  const toggleClassification = (value: string) => {
    setForm((f) => ({
      ...f,
      classifications: f.classifications.includes(value)
        ? f.classifications.filter((c) => c !== value)
        : [...f.classifications, value],
    }));
    setStatus("idle");
  };

  const persist = async () => {
    await saveCrm({
      profileId: form.profileId,
      referredBy: form.referredBy,
      breakthrough: form.breakthrough,
      upsellPossible: form.upsellPossible,
      rating: form.rating,
      classifications: form.classifications,
      impact: form.impact,
    });
    await saveCrmAssets(
      form.profileId,
      CRM_ASSET_FIELDS.map((f) => ({ kind: f.kind, ...slots[f.kind] })),
    );
  };

  const save = () =>
    startTransition(async () => {
      setStatus("saving");
      await persist();
      setStatus("saved");
    });

  // Debounced autosave: CRM edits persist on their own after 1.2s of quiet, so
  // admin/consultant notes are never lost. Consultant reassignment (A11) already
  // saves immediately via reassign(). Manual "Save CRM" stays as a fallback.
  const firstRender = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      persist()
        .then(() => setStatus("saved"))
        .catch(() => setStatus("idle"));
    }, 1200);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.referredBy, form.breakthrough, form.upsellPossible, form.rating, form.classifications, form.impact, slots]);

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

      {/* Classification (multi-select) + upsell */}
      <section className="space-y-4">
        <div>
          <label className={labelCls}>Participant classification (A22)</label>
          <div role="group" aria-label="Participant classification" className="mt-1 flex flex-wrap gap-2">
            {CLASSIFICATIONS.map((c) => {
              const on = form.classifications.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  disabled={!isAdmin}
                  onClick={() => toggleClassification(c.value)}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/40 disabled:cursor-not-allowed disabled:opacity-50 ${
                    on
                      ? "border-red bg-red text-paper"
                      : "border-hairline bg-surface-sunk text-ink-muted hover:border-ink-muted hover:text-ink"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[12px] text-ink-muted">
            {form.classifications.length
              ? "Select all that apply — a participant can hold several."
              : "None selected. A participant can hold several classifications."}
          </p>
        </div>
        <label className="flex items-center gap-3">
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

      {/* Assets & proof (A3–A9, A21) */}
      <section>
        <p className="kicker mb-3">Assets & proof (A3–A9, A21)</p>
        <div className="space-y-4">
          {CRM_ASSET_FIELDS.map((f) => {
            const slot = slots[f.kind];
            return (
              <div key={f.kind} className="rounded border border-hairline p-3">
                <label className={labelCls}>{f.label}</label>
                <div className="mt-1.5 grid gap-2 md:grid-cols-2">
                  {f.text && (
                    <input
                      className={field}
                      placeholder="Text"
                      value={slot.body}
                      onChange={(e) => setSlot(f.kind, { body: e.target.value })}
                    />
                  )}
                  {f.link && (
                    <input
                      className={field}
                      placeholder="Link (https://…)"
                      value={slot.url}
                      onChange={(e) => setSlot(f.kind, { url: e.target.value })}
                    />
                  )}
                  {f.image && (
                    <CrmImageInput
                      participantId={form.profileId}
                      value={slot.image}
                      previewUrl={slot.imageUrl}
                      onChange={(v) => setSlot(f.kind, { image: v })}
                      onPreview={(u) => setSlot(f.kind, { imageUrl: u })}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-[12px] text-ink-muted">
        Image uploads go to the private <code className="font-mono">crm-assets</code>{" "}
        bucket (admins + the designated consultant only). Paste a URL/path if you
        prefer.
      </p>

      <div className="flex items-center gap-3 border-t border-hairline pt-5">
        <button
          type="button"
          onClick={save}
          disabled={pending || status === "saving"}
          className="rounded bg-red px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-50"
        >
          {pending || status === "saving" ? "Saving…" : "Save now"}
        </button>
        <span className="text-[13px] text-ink-muted">
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "✓ All changes saved"
              : "Changes save automatically"}
        </span>
      </div>
    </div>
  );
}

// Asset proof image: upload to the private crm-assets bucket under the
// participant's folder, or paste a URL/path. Stores the canonical storage path
// (or a pasted URL); previews via the read-only signed URL. `previewUrl` comes
// from the server (signed) for an already-saved image; a fresh upload previews
// instantly from a local object URL until the next reload re-signs it.
function CrmImageInput({
  participantId,
  value,
  previewUrl,
  onChange,
  onPreview,
}: {
  participantId: string;
  value: string;
  previewUrl: string | null;
  onChange: (v: string) => void;
  onPreview: (url: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  const isHttp = (s: string) => /^https?:\/\//i.test(s);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setBroken(false);
    setBusy(true);
    const r = await uploadFile("crm-assets", participantId, file, { allow: "image" });
    setBusy(false);
    if (r.ok) {
      onChange(r.path);
      onPreview(URL.createObjectURL(file)); // instant local preview (private bucket → no public URL)
    } else {
      setErr(r.error);
    }
  };

  const editPath = (v: string) => {
    onChange(v);
    setBroken(false);
    // A pasted http(s) URL previews directly; a bare storage path can only be
    // signed server-side, so it previews after the next save/reload.
    onPreview(isHttp(v) ? v : null);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          className={field}
          placeholder="Image URL or storage path"
          value={value}
          onChange={(e) => editPath(e.target.value)}
        />
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="shrink-0 rounded border border-hairline px-3 py-2 text-[13px] text-ink transition-colors hover:border-ink-muted disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>
      {previewUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Evidence preview"
          onError={() => setBroken(true)}
          className="h-20 w-auto rounded border border-hairline object-cover"
        />
      ) : value && !previewUrl ? (
        <p className="text-[12px] text-ink-muted">Saved image — preview appears after reload.</p>
      ) : broken ? (
        <p className="text-[12px] text-ink-muted">Image unavailable (the link may have expired — reload to refresh).</p>
      ) : null}
      {err && <p className="text-[12px] text-red">{err}</p>}
    </div>
  );
}
