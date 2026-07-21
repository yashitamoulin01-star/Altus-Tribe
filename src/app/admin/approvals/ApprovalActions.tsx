"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveMember, rejectMember } from "../actions";

// Approve promotes a pending signup to active; reject parks them as inactive.
export default function ApprovalActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: (id: string) => Promise<{ ok: boolean }>) =>
    startTransition(async () => {
      await fn(id);
      router.refresh();
    });

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        className="rounded bg-red px-3 py-1 text-[12px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
        disabled={pending}
        onClick={() => run(approveMember)}
      >
        Approve
      </button>
      <button
        className="rounded border border-hairline px-3 py-1 text-[12px] text-ink-secondary transition-colors hover:border-ink-muted disabled:opacity-40"
        disabled={pending}
        onClick={() => run(rejectMember)}
      >
        Reject
      </button>
    </div>
  );
}
