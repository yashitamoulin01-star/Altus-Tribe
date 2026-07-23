"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveEvent, deleteEvent, type EventInput } from "../actions";
import type { EventItem } from "@/lib/events";

const field =
  "w-full rounded-lg border border-hairline bg-surface-sunk px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none";
const lbl = "mb-1 block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted";

// datetime-local <-> ISO helpers. The input works in local time; we store UTC ISO.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
function fromLocalInput(v: string): string {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

const EMPTY: EventInput = {
  title: "", description: "", location: "", link: "",
  startsAt: "", endsAt: "", featured: false,
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function EventManager({ initial }: { initial: EventItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState<EventInput>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof EventInput>(k: K, v: EventInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const editExisting = (e: EventItem) => {
    setEditingId(e.id);
    setForm({
      id: e.id,
      title: e.title,
      description: e.description ?? "",
      location: e.location ?? "",
      link: e.link ?? "",
      startsAt: e.startsAt,
      endsAt: e.endsAt ?? "",
      featured: e.featured,
    });
    setError(null);
  };
  const reset = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
  };

  const submit = () =>
    start(async () => {
      setError(null);
      const r = await saveEvent(form);
      if (r.ok) {
        reset();
        router.refresh();
      } else {
        setError(r.error ?? "Couldn't save the event.");
      }
    });

  const remove = (id: string) =>
    start(async () => {
      await deleteEvent(id);
      if (editingId === id) reset();
      router.refresh();
    });

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* List */}
      <section>
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          {initial.length} {initial.length === 1 ? "event" : "events"}
        </h2>
        {initial.length === 0 ? (
          <p className="rounded-xl border border-hairline px-4 py-10 text-center text-[14px] text-ink-secondary">
            No events yet. Add one on the right.
          </p>
        ) : (
          <ul className="space-y-3">
            {initial.map((e) => (
              <li key={e.id} className="rounded-xl border border-hairline p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[15px] font-medium text-ink">
                      <span className="truncate">{e.title}</span>
                      {e.featured && (
                        <span className="shrink-0 rounded bg-red/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-red">
                          Featured
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[13px] text-ink-muted">
                      {fmt(e.startsAt)}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                    {e.description && (
                      <p className="mt-1.5 line-clamp-2 text-[13px] text-ink-secondary">{e.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => editExisting(e)} className="text-[13px] text-ink-muted transition-colors hover:text-ink">Edit</button>
                    <button type="button" onClick={() => remove(e.id)} disabled={pending} className="text-[13px] text-ink-muted transition-colors hover:text-red disabled:opacity-50">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Editor */}
      <section className="h-max rounded-xl border border-hairline p-5">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">
          {editingId ? "Edit event" : "New event"}
        </h2>
        <div className="space-y-3">
          <div>
            <label className={lbl}>Title</label>
            <input className={field} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Altus Conclave" />
          </div>
          <div>
            <label className={lbl}>Description</label>
            <textarea className={`${field} min-h-20 resize-y`} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Starts</label>
              <input type="datetime-local" className={field} value={toLocalInput(form.startsAt)} onChange={(e) => set("startsAt", fromLocalInput(e.target.value))} />
            </div>
            <div>
              <label className={lbl}>Ends (optional)</label>
              <input type="datetime-local" className={field} value={toLocalInput(form.endsAt)} onChange={(e) => set("endsAt", fromLocalInput(e.target.value))} />
            </div>
          </div>
          <div>
            <label className={lbl}>Location</label>
            <input className={field} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Mumbai / Online" />
          </div>
          <div>
            <label className={lbl}>Link (optional)</label>
            <input className={field} value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="https://…" />
          </div>
          <label className="flex items-center gap-2.5 pt-1">
            <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-[var(--color-red)]" />
            <span className="text-[14px] text-ink">Feature on members&apos; home</span>
          </label>

          {error && <p className="text-[13px] text-red">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={submit} disabled={pending || !form.title.trim() || !form.startsAt} className="rounded-lg bg-red px-5 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-50">
              {pending ? "Saving…" : editingId ? "Save changes" : "Add event"}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="text-[13px] text-ink-muted transition-colors hover:text-ink">Cancel</button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
