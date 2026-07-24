"use client";

import { useMemo, useState, useTransition } from "react";
import { sendBroadcast } from "../actions";
import type { RosterMember } from "@/lib/admin";

// Targeted broadcast composer (docs/17 §4). Compose an in-app notification and
// send it to a chosen audience. HONEST: in-app only — no push/email provider —
// so recipients see it in their notification center + bell, not as a push/email.

type AudienceType = "all" | "members" | "consultants" | "one";

const AUDIENCES: { value: AudienceType; label: string }[] = [
  { value: "all", label: "All active members" },
  { value: "members", label: "Members only" },
  { value: "consultants", label: "Consultants & admins" },
  { value: "one", label: "A single member" },
];

export default function BroadcastComposer({ roster }: { roster: RosterMember[] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<AudienceType>("all");
  const [memberId, setMemberId] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const activeMembers = useMemo(
    () => roster.filter((m) => m.status === "active"),
    [roster],
  );

  const inputCls =
    "w-full rounded border border-hairline bg-surface-sunk px-3 py-2 text-[14px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none";

  const canSend =
    title.trim().length > 0 && !pending && (audience !== "one" || memberId !== "");

  const send = () => {
    if (!canSend) return;
    setResult(null);
    startTransition(async () => {
      const r = await sendBroadcast({
        title,
        body,
        link,
        audience: { type: audience, memberId: audience === "one" ? memberId : undefined },
      });
      if (r.ok) {
        setResult({ ok: true, msg: `Sent to ${r.count} ${r.count === 1 ? "member" : "members"}.` });
        setTitle("");
        setBody("");
        setLink("");
      } else {
        setResult({ ok: false, msg: r.error ?? "Couldn't send." });
      }
    });
  };

  return (
    <div className="max-w-[640px] space-y-5">
      <div>
        <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
          Title
        </label>
        <input
          className={inputCls}
          value={title}
          maxLength={200}
          placeholder="e.g. Conclave registration closes Friday"
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
          Message (optional)
        </label>
        <textarea
          className={`${inputCls} min-h-24 resize-y`}
          value={body}
          maxLength={2000}
          placeholder="A short line members will see under the title."
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
          Link (optional)
        </label>
        <input
          className={inputCls}
          value={link}
          placeholder="/sacred-space or https://…"
          onChange={(e) => setLink(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
          Audience
        </label>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setAudience(a.value)}
              aria-pressed={audience === a.value}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/40 ${
                audience === a.value
                  ? "border-red bg-red text-paper"
                  : "border-hairline bg-surface-sunk text-ink-muted hover:border-ink-muted hover:text-ink"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        {audience === "one" && (
          <select
            className={`${inputCls} mt-3`}
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
          >
            <option value="">— Choose a member —</option>
            {activeMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.fullName}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className="rounded bg-red px-5 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
        >
          {pending ? "Sending…" : "Send broadcast"}
        </button>
        {result ? (
          <span className={`text-[13px] ${result.ok ? "text-ink-secondary" : "text-red"}`}>
            {result.ok ? "✓ " : ""}
            {result.msg}
          </span>
        ) : (
          <span className="text-[12px] text-ink-muted">
            In-app only — appears in members&apos; notifications, not push/email.
          </span>
        )}
      </div>
    </div>
  );
}
