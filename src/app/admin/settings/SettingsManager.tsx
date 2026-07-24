"use client";

import { useState, useTransition } from "react";
import { saveSetting } from "../actions";
import { SETTINGS, SETTING_GROUPS, type SettingDef } from "@/lib/settings-meta";
import type { Settings } from "@/lib/settings";

// Grouped app-settings editor. Each row saves independently (save-per-field), so
// one bad URL never blocks the others. URL/video fields validate on the server.
export default function SettingsManager({ initial }: { initial: Settings }) {
  return (
    <div className="space-y-10">
      {SETTING_GROUPS.map((group) => {
        const rows = SETTINGS.filter((s) => s.group === group);
        if (!rows.length) return null;
        return (
          <section key={group}>
            <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              {group}
            </h2>
            <div className="space-y-4">
              {rows.map((def) => (
                <SettingRow key={def.key} def={def} initial={initial[def.key] ?? ""} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SettingRow({ def, initial }: { def: SettingDef; initial: string }) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<{ ok: boolean; msg: string } | null>(null);
  const dirty = value !== initial;

  const save = () =>
    startTransition(async () => {
      setState(null);
      const r = await saveSetting(def.key, value);
      setState(r.ok ? { ok: true, msg: "Saved" } : { ok: false, msg: r.error ?? "Couldn't save" });
    });

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-4 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <label htmlFor={`set-${def.key}`} className="mb-1 block text-[14px] font-medium text-ink">
          {def.label}
        </label>
        <input
          id={`set-${def.key}`}
          type={def.kind === "text" ? "text" : "url"}
          inputMode={def.kind === "text" ? "text" : "url"}
          className="w-full rounded border border-hairline bg-surface-sunk px-3 py-2 text-[14px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
          placeholder={def.placeholder ?? ""}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setState(null);
          }}
        />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className="rounded bg-red px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {state && (
          <span className={`text-[12px] ${state.ok ? "text-ink-secondary" : "text-red"}`}>
            {state.ok ? "✓ " : ""}
            {state.msg}
          </span>
        )}
      </div>
    </div>
  );
}
