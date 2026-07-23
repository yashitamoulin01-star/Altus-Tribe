"use client";

import { useState } from "react";

// Repeatable-entry chips (spec §4/U). Value is serialized as newline-separated
// text so it fits the EXISTING text columns (network_groups / can_connect /
// want_connect) with no schema change. Legacy comma/free-text values still parse.
function parse(value: string): string[] {
  return (value || "")
    .split(/\r?\n/)
    .flatMap((line) => (line.includes("\n") ? line.split("\n") : [line]))
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ChipInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const items = parse(value);
  const [draft, setDraft] = useState("");

  const commit = (next: string[]) => onChange(next.join("\n"));

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    if (items.some((i) => i.toLowerCase() === t.toLowerCase())) {
      setDraft("");
      return;
    }
    commit([...items, t]);
    setDraft("");
  };

  const remove = (i: number) => commit(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-stretch gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-hairline bg-surface-sunk px-4 py-3 text-[16px] text-ink placeholder:text-ink-muted focus:border-red/50 focus:outline-none focus:ring-4 focus:ring-red/10"
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-lg bg-red px-4 text-[14px] font-medium text-white transition-colors hover:bg-red-hover"
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1 text-[13px] text-ink"
            >
              {item}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${item}`}
                className="text-ink-muted transition-colors hover:text-red"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
