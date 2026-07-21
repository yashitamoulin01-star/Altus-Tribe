"use client";

import { useState, useTransition } from "react";
import { setBookmark, setCompleted } from "./actions";

// Bookmark (+ optional "mark watched") toggles for a resource. Optimistic; the
// server action re-checks auth and is scoped to the caller by RLS.
export default function ResourceActions({
  resourceId,
  bookmarked,
  completed,
  showComplete = false,
}: {
  resourceId: string;
  bookmarked: boolean;
  completed: boolean;
  showComplete?: boolean;
}) {
  const [b, setB] = useState(bookmarked);
  const [c, setC] = useState(completed);
  const [pending, start] = useTransition();

  const chip = (on: boolean) =>
    `rounded-lg border px-3 py-1.5 text-[13px] transition-colors disabled:opacity-50 ${
      on ? "border-red bg-red/10 text-red" : "border-hairline text-ink-muted hover:border-ink-muted"
    }`;

  const toggleBookmark = () =>
    start(async () => {
      const next = !b;
      setB(next);
      const r = await setBookmark(resourceId, next);
      if (!r.ok) setB(!next);
    });
  const toggleWatched = () =>
    start(async () => {
      const next = !c;
      setC(next);
      const r = await setCompleted(resourceId, next);
      if (!r.ok) setC(!next);
    });

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={toggleBookmark} disabled={pending} aria-pressed={b} className={chip(b)}>
        {b ? "★ Saved" : "☆ Save"}
      </button>
      {showComplete ? (
        <button type="button" onClick={toggleWatched} disabled={pending} aria-pressed={c} className={chip(c)}>
          {c ? "✓ Completed" : "Mark complete"}
        </button>
      ) : (
        c && <span className="text-[12px] font-medium text-positive">✓ Completed</span>
      )}
    </div>
  );
}
