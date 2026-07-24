"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createGroup } from "../actions";

interface PickPerson {
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

export default function NewGroupForm({ connections }: { connections: PickPerson[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return connections;
    return connections.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.roleTitle.toLowerCase().includes(q),
    );
  }, [connections, query]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const canCreate = title.trim().length >= 2 && selected.size >= 1 && !pending;

  const submit = () => {
    if (!canCreate) return;
    setError(null);
    startTransition(async () => {
      const res = await createGroup(title.trim(), [...selected]);
      if (res.id) {
        router.push(`/messages/${res.id}`);
      } else if (res.error === "offline") {
        setError("You're offline — connect to create a group.");
      } else {
        setError(res.error ?? "Couldn't create the group. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Group name */}
      <div>
        <label
          htmlFor="group-name"
          className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted"
        >
          Group name
        </label>
        <input
          id="group-name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="e.g. Founders in Manufacturing"
          className="w-full rounded-xl border border-hairline bg-surface-sunk/80 px-4 py-3 text-[15px] text-ink placeholder:text-ink-muted focus:border-red focus:outline-none focus:ring-2 focus:ring-red/20 transition-all"
        />
      </div>

      {/* Member picker */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
            Add members
          </label>
          <span className="font-mono text-[11px] text-ink-muted">
            {selected.size} selected
          </span>
        </div>

        {connections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline bg-surface/40 py-12 text-center">
            <p className="text-[14px] font-semibold text-ink">No connections yet</p>
            <p className="mt-1 text-[13px] text-ink-muted mb-4">
              Connect with members first, then start a group with them.
            </p>
            <Link
              href="/explore"
              className="inline-block rounded-xl bg-red px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover"
            >
              Browse Directory →
            </Link>
          </div>
        ) : (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your connections…"
              className="mb-3 w-full rounded-xl border border-hairline bg-surface-sunk/80 px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-muted focus:border-red focus:outline-none focus:ring-2 focus:ring-red/20 transition-all"
            />
            <ul className="max-h-[46vh] divide-y divide-hairline/60 overflow-y-auto rounded-2xl border border-hairline/80 bg-surface/80">
              {filtered.length === 0 && (
                <li className="px-4 py-6 text-center text-[13px] text-ink-muted">
                  No matches.
                </li>
              )}
              {filtered.map((c) => {
                const on = selected.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggle(c.id)}
                      aria-pressed={on}
                      className="flex w-full items-center gap-3 p-3 text-left transition-all hover:bg-surface-hover/80"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-hairline bg-surface-sunk">
                        {c.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.photoUrl} alt={c.fullName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center font-mono text-[12px] font-semibold text-ink-muted">
                            {initials(c.fullName)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-ink">
                          {c.fullName}
                        </p>
                        {c.roleTitle && (
                          <p className="truncate text-[12px] text-ink-secondary">
                            {c.roleTitle}
                          </p>
                        )}
                      </div>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold transition-all ${
                          on
                            ? "border-red bg-red text-white"
                            : "border-hairline text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {error && (
        <p className="font-mono text-[12px] text-red">⚠️ {error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!canCreate}
          className="rounded-xl bg-red px-6 py-3 text-[14px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover active:scale-95 disabled:opacity-40"
        >
          {pending ? "Creating…" : "Create group"}
        </button>
        <Link
          href="/messages"
          className="rounded-xl border border-hairline px-6 py-3 text-[14px] font-semibold text-ink-secondary transition-all hover:bg-surface-hover"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
