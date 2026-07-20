"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkInsertMembers } from "../actions";

// Bulk upload (#167–168): a 3-step upload → map → confirm flow. CSV is parsed
// client-side; the mapped rows are inserted by a server action under RLS.
// (Live commit creates member rows; wiring invited auth accounts is the
// service-role step deferred to the live-DB pass.)

const FIELDS = [
  { key: "full_name", label: "Full name", required: true },
  { key: "slug", label: "Slug (auto from name if blank)", required: false },
  { key: "city", label: "City", required: false },
  { key: "industry", label: "Industry", required: false },
  { key: "category", label: "Category", required: false },
  { key: "cq_batch", label: "CQ batch", required: false },
  { key: "ps_batch", label: "PS batch", required: false },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

// Minimal CSV parser: handles quoted fields and commas within quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); if (row.some((c) => c.trim() !== "")) rows.push(row); }
  return rows;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function ImportStepper() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Record<FieldKey, number | -1>>({
    full_name: -1, slug: -1, city: -1, industry: -1, category: -1, cq_batch: -1, ps_batch: -1,
  });
  const [result, setResult] = useState<string | null>(null);

  const onFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.length) return;
    const [head, ...body] = parsed;
    setHeaders(head);
    setRows(body);
    // Best-effort auto-map by header name.
    const auto = { ...map };
    head.forEach((h, i) => {
      const norm = h.toLowerCase().replace(/[^a-z]/g, "");
      for (const f of FIELDS) {
        if (norm.includes(f.key.replace(/_/g, "")) || (f.key === "full_name" && norm.includes("name"))) {
          if (auto[f.key] === -1) auto[f.key] = i;
        }
      }
    });
    setMap(auto);
    setStep(2);
  };

  const mapped = rows.map((r) => {
    const get = (k: FieldKey) => (map[k] >= 0 ? (r[map[k]] ?? "").trim() : "");
    const full_name = get("full_name");
    return {
      full_name,
      slug: get("slug") || slugify(full_name),
      city: get("city"),
      industry: get("industry"),
      category: get("category"),
      cq_batch: get("cq_batch"),
      ps_batch: get("ps_batch"),
    };
  });
  const valid = mapped.filter((m) => m.full_name && m.slug);

  const commit = () =>
    startTransition(async () => {
      const res = await bulkInsertMembers(valid);
      setResult(
        res.ok
          ? `Imported ${res.inserted} member${res.inserted === 1 ? "" : "s"}.`
          : "Nothing imported (offline preview, or the server rejected the rows).",
      );
      if (res.ok) router.refresh();
    });

  const stepPill = (n: number, label: string) => (
    <div className="flex items-center gap-2">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${
        step >= n ? "bg-red text-paper" : "bg-surface-sunk text-ink-muted"
      }`}>{n}</span>
      <span className={`text-[13px] ${step >= n ? "text-ink" : "text-ink-muted"}`}>{label}</span>
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        {stepPill(1, "Upload")}
        <span className="h-px w-8 bg-hairline" />
        {stepPill(2, "Map")}
        <span className="h-px w-8 bg-hairline" />
        {stepPill(3, "Confirm")}
      </div>

      {step === 1 && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-hairline bg-surface-sunk px-6 py-16 text-center transition-colors hover:border-ink-muted">
          <span className="text-[15px] text-ink">Choose a CSV file</span>
          <span className="mt-1 text-[13px] text-ink-muted">
            First row = column headers. Excel: export as CSV.
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>
      )}

      {step === 2 && (
        <div>
          <p className="mb-4 text-[14px] text-ink-secondary">
            Match your columns to member fields. {rows.length} data row
            {rows.length === 1 ? "" : "s"} detected.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3 rounded border border-hairline px-3 py-2">
                <span className="text-[14px] text-ink">
                  {f.label}
                  {f.required && <span className="text-red"> *</span>}
                </span>
                <select
                  className="rounded border border-hairline bg-surface-sunk px-2 py-1 text-[13px] text-ink focus:border-ink focus:outline-none"
                  value={map[f.key]}
                  onChange={(e) => setMap((m) => ({ ...m, [f.key]: Number(e.target.value) }))}
                >
                  <option value={-1}>—</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={map.full_name === -1}
              className="rounded bg-red px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
            >
              Preview →
            </button>
            <button type="button" onClick={() => setStep(1)} className="rounded border border-hairline px-5 py-2.5 text-[15px] text-ink hover:border-ink-muted">
              Back
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="mb-4 text-[14px] text-ink-secondary">
            {valid.length} of {mapped.length} rows are valid (need a name + slug).
          </p>
          <div className="max-h-80 overflow-auto rounded border border-hairline">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-surface-sunk">
                <tr>{["Name", "Slug", "City", "Industry", "Batch"].map((h) => (
                  <th key={h} className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {valid.slice(0, 50).map((m, i) => (
                  <tr key={i} className="border-t border-hairline">
                    <td className="px-3 py-1.5 text-ink">{m.full_name}</td>
                    <td className="px-3 py-1.5 font-mono text-ink-muted">{m.slug}</td>
                    <td className="px-3 py-1.5 text-ink-secondary">{m.city}</td>
                    <td className="px-3 py-1.5 text-ink-secondary">{m.industry}</td>
                    <td className="px-3 py-1.5 text-ink-secondary">{[m.cq_batch, m.ps_batch].filter(Boolean).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result ? (
            <p className="mt-5 rounded border border-hairline bg-surface-sunk px-4 py-3 text-[14px] text-ink">{result}</p>
          ) : (
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={commit}
                disabled={pending || valid.length === 0}
                className="rounded bg-red px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
              >
                {pending ? "Importing…" : `Import ${valid.length} members`}
              </button>
              <button type="button" onClick={() => setStep(2)} className="rounded border border-hairline px-5 py-2.5 text-[15px] text-ink hover:border-ink-muted">
                Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
