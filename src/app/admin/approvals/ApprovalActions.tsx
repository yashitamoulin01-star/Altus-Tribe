"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveMember, rejectMember, requestChanges } from "../actions";

// Approve promotes a pending signup to active; reject parks them as inactive;
// request-changes keeps them pending with an admin note describing what to fix.
export default function ApprovalActions({
  id,
  reviewState,
  reviewNote,
}: {
  id: string;
  reviewState: "changes_requested" | null;
  reviewNote: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(reviewNote ?? "");

  const run = (fn: () => Promise<{ ok: boolean }>) =>
    startTransition(async () => {
      await fn();
      setOpen(false);
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-2">
      {reviewState === "changes_requested" && !open && (
        <div className="w-full max-w-[280px] rounded border border-hairline-bright bg-surface-sunk px-3 py-2 text-left">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-red">
            Changes requested
          </p>
          {reviewNote && (
            <p className="mt-1 text-[12px] leading-snug text-ink-secondary">{reviewNote}</p>
          )}
        </div>
      )}

      {open ? (
        <div className="w-full max-w-[280px]">
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="What should the applicant fix before approval?"
            className="w-full resize-none rounded border border-hairline bg-surface-sunk px-2.5 py-2 text-[13px] text-ink placeholder:text-ink-muted focus:border-ink-muted focus:outline-none"
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button
              className="rounded border border-hairline px-3 py-1 text-[12px] text-ink-secondary transition-colors hover:border-ink-muted disabled:opacity-40"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setNote(reviewNote ?? "");
              }}
            >
              Cancel
            </button>
            <button
              className="rounded bg-red px-3 py-1 text-[12px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
              disabled={pending || note.trim().length === 0}
              onClick={() => run(() => requestChanges(id, note))}
            >
              Send request
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-1.5">
          <button
            className="rounded bg-red px-3 py-1 text-[12px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
            disabled={pending}
            onClick={() => run(() => approveMember(id))}
          >
            Approve
          </button>
          <button
            className="rounded border border-hairline px-3 py-1 text-[12px] text-ink-secondary transition-colors hover:border-ink-muted disabled:opacity-40"
            disabled={pending}
            onClick={() => setOpen(true)}
          >
            {reviewState === "changes_requested" ? "Edit note" : "Request changes"}
          </button>
          <button
            className="rounded border border-hairline px-3 py-1 text-[12px] text-ink-secondary transition-colors hover:border-ink-muted disabled:opacity-40"
            disabled={pending}
            onClick={() => run(() => rejectMember(id))}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
