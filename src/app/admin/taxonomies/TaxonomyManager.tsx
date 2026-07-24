"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTaxonomy, deleteTaxonomy } from "../actions";
import type { AdminTaxonomy } from "@/lib/admin-content";

// Admin CRUD for one taxonomy kind (industry / category / city / …). The values
// here populate the profile editor dropdowns + Explore filters (docs/17 §6).
export default function TaxonomyManager({
  kind,
  label,
  items,
}: {
  kind: string;
  label: string;
  items: AdminTaxonomy[];
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const add = () =>
    start(async () => {
      setErr("");
      const r = await addTaxonomy(kind, value);
      if (!r.ok) {
        setErr(r.error ?? "Couldn't add.");
        return;
      }
      setValue("");
      router.refresh();
    });

  const remove = (id: string) =>
    start(async () => {
      await deleteTaxonomy(id);
      router.refresh();
    });

  return (
    <section className="rounded-xl border border-hairline bg-surface p-5">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</h2>

      <div className="flex items-center gap-2">
        <input
          className="w-full rounded-lg border border-hairline bg-surface-sunk px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
          placeholder={`Add a ${label.toLowerCase().replace(/s$/, "")}…`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim() && !pending) add();
          }}
        />
        <button
          type="button"
          disabled={pending || !value.trim()}
          onClick={add}
          className="shrink-0 rounded-lg bg-red px-4 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {err && <p className="mt-2 text-[13px] text-red">{err}</p>}

      <ul className="mt-4 flex flex-wrap gap-2">
        {items.length === 0 && (
          <li className="py-1 text-[14px] text-ink-muted">No values yet.</li>
        )}
        {items.map((t) => (
          <li
            key={t.id}
            className="group inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-sunk py-1 pl-3 pr-1.5 text-[13px] text-ink"
          >
            {t.value}
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(t.id)}
              aria-label={`Remove ${t.value}`}
              className="flex h-5 w-5 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-red-muted hover:text-red disabled:opacity-50"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
