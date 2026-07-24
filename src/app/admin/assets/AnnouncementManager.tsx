"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAnnouncement, deleteAnnouncement, setAnnouncementPinned } from "../actions";
import type { AdminAnnouncement } from "@/lib/admin-content";

const field =
  "w-full rounded-lg border border-hairline bg-surface-sunk px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none";

export default function AnnouncementManager({
  items,
}: {
  items: AdminAnnouncement[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const submit = (publish: boolean) =>
    start(async () => {
      setErr("");
      const r = await createAnnouncement({ title, body, publish });
      if (!r.ok) {
        setErr(r.error ?? "Couldn't save.");
        return;
      }
      setTitle("");
      setBody("");
      router.refresh();
    });

  const remove = (id: string) =>
    start(async () => {
      await deleteAnnouncement(id);
      router.refresh();
    });

  const togglePin = (id: string, pinned: boolean) =>
    start(async () => {
      await setAnnouncementPinned(id, !pinned);
      router.refresh();
    });

  return (
    <div>
      <div className="rounded-xl border border-hairline bg-surface p-5">
        <input className={field} placeholder="Announcement title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className={`${field} mt-3 min-h-[90px] resize-y`} placeholder="Write the note to the Tribe…" value={body} onChange={(e) => setBody(e.target.value)} />
        {err && <p className="mt-2 text-[13px] text-red">{err}</p>}
        <div className="mt-3 flex items-center gap-2">
          <button type="button" disabled={pending || !title.trim()} onClick={() => submit(true)} className="rounded-lg bg-red px-4 py-2 text-[14px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-50">
            {pending ? "Saving…" : "Publish"}
          </button>
          <button type="button" disabled={pending || !title.trim()} onClick={() => submit(false)} className="rounded-lg border border-hairline px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted disabled:opacity-50">
            Save draft
          </button>
        </div>
        <p className="mt-2 text-[12px] text-ink-muted">Publishing notifies every active member.</p>
      </div>

      <ul className="mt-5 divide-y divide-hairline">
        {items.length === 0 && <li className="py-4 text-[14px] text-ink-muted">No announcements yet.</li>}
        {items.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[15px] font-medium text-ink">
                {a.title}
                <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${a.published ? "bg-ink/10 text-ink" : "bg-surface-sunk text-ink-muted"}`}>
                  {a.published ? "Published" : "Draft"}
                </span>
                {a.pinned && (
                  <span className="rounded bg-red-muted px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-red">
                    ★ Pinned
                  </span>
                )}
              </p>
              {a.body && <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-muted">{a.body}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                disabled={pending || !a.published}
                onClick={() => togglePin(a.id, a.pinned)}
                title={a.published ? undefined : "Publish before pinning"}
                className="text-[13px] text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
              >
                {a.pinned ? "Unpin" : "Pin"}
              </button>
              <button type="button" disabled={pending} onClick={() => remove(a.id)} className="text-[13px] text-ink-muted transition-colors hover:text-red disabled:opacity-50">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
