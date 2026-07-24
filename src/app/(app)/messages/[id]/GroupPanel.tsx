"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addGroupMembers, leaveGroup } from "../actions";
import type { GroupInfo } from "@/lib/messaging";

interface Addable {
  id: string;
  fullName: string;
  photoUrl: string | null;
  roleTitle: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

export default function GroupPanel({
  group,
  addable,
}: {
  group: GroupInfo;
  addable: Addable[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Connections not already in the group.
  const candidates = useMemo(() => {
    const inGroup = new Set(group.members.map((m) => m.id));
    return addable.filter((a) => !inGroup.has(a.id));
  }, [addable, group.members]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const doAdd = () => {
    if (selected.size === 0 || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await addGroupMembers(group.id, [...selected]);
      if (res.ok) {
        setSelected(new Set());
        setAdding(false);
        router.refresh();
      } else {
        setError(res.error === "offline" ? "You're offline." : "Couldn't add members.");
      }
    });
  };

  const doLeave = () => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await leaveGroup(group.id);
      if (res.ok) router.push("/messages");
      else setError(res.error === "offline" ? "You're offline." : "Couldn't leave the group.");
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="rounded-lg border border-hairline px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-secondary transition-all hover:bg-surface-hover"
      >
        {group.members.length} members
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-[320px] max-w-[86vw] rounded-2xl border border-hairline bg-paper p-4 shadow-xl shadow-black/10">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            Group members
          </p>

          <ul className="mb-4 max-h-[38vh] space-y-1 overflow-y-auto">
            {group.members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-hairline bg-surface-sunk">
                  {m.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photoUrl} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-mono text-[11px] font-semibold text-ink-muted">
                      {initials(m.name)}
                    </span>
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                  {m.id === group.meId ? "You" : m.name}
                </span>
                {m.isOwner && (
                  <span className="shrink-0 rounded-full bg-red/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-red font-semibold">
                    Owner
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Add members */}
          {adding ? (
            <div className="mb-3 rounded-xl border border-hairline/80 bg-surface/60 p-2">
              {candidates.length === 0 ? (
                <p className="px-2 py-3 text-center text-[12px] text-ink-muted">
                  All your connections are already here.
                </p>
              ) : (
                <ul className="max-h-[28vh] space-y-0.5 overflow-y-auto">
                  {candidates.map((c) => {
                    const on = selected.has(c.id);
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => toggle(c.id)}
                          aria-pressed={on}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-all hover:bg-surface-hover"
                        >
                          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-hairline bg-surface-sunk">
                            {c.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.photoUrl} alt={c.fullName} className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center font-mono text-[10px] font-semibold text-ink-muted">
                                {initials(c.fullName)}
                              </span>
                            )}
                          </div>
                          <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                            {c.fullName}
                          </span>
                          <span
                            className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition-all ${
                              on ? "border-red bg-red text-white" : "border-hairline text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={doAdd}
                  disabled={selected.size === 0 || pending}
                  className="flex-1 rounded-lg bg-red px-3 py-2 text-[12px] font-semibold text-white transition-all hover:bg-red-hover disabled:opacity-40"
                >
                  {pending ? "Adding…" : `Add ${selected.size || ""}`.trim()}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setSelected(new Set());
                  }}
                  className="rounded-lg border border-hairline px-3 py-2 text-[12px] font-semibold text-ink-secondary transition-all hover:bg-surface-hover"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="mb-2 w-full rounded-lg border border-hairline px-3 py-2 text-[12px] font-semibold text-ink transition-all hover:bg-surface-hover"
            >
              ＋ Add members
            </button>
          )}

          {error && <p className="mb-2 font-mono text-[11px] text-red">⚠️ {error}</p>}

          <button
            type="button"
            onClick={doLeave}
            disabled={pending}
            className="w-full rounded-lg px-3 py-2 text-[12px] font-semibold text-red transition-all hover:bg-red/10 disabled:opacity-40"
          >
            Leave group
          </button>
        </div>
      )}
    </div>
  );
}
