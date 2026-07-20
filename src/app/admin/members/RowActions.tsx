"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMemberStatus, deleteMember } from "../actions";
import type { MemberStatus } from "@/lib/admin";

// Per-row roster actions (#169–173). Hide/Show/Inactivate/Delete via server
// actions with an optimistic-ish refresh. Delete asks once.
export default function RowActions({
  id,
  status,
}: {
  id: string;
  status: MemberStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const change = (next: MemberStatus) =>
    startTransition(async () => {
      await setMemberStatus(id, next);
      router.refresh();
    });

  const remove = () =>
    startTransition(async () => {
      await deleteMember(id);
      router.refresh();
    });

  const btn =
    "rounded border border-hairline px-2.5 py-1 text-[12px] text-ink transition-colors hover:border-ink-muted disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {status !== "active" && (
        <button className={btn} disabled={pending} onClick={() => change("active")}>
          Show
        </button>
      )}
      {status !== "hidden" && (
        <button className={btn} disabled={pending} onClick={() => change("hidden")}>
          Hide
        </button>
      )}
      {status !== "inactive" && (
        <button className={btn} disabled={pending} onClick={() => change("inactive")}>
          Inactivate
        </button>
      )}
      {confirming ? (
        <>
          <button
            className="rounded bg-red px-2.5 py-1 text-[12px] text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
            disabled={pending}
            onClick={remove}
          >
            Confirm delete
          </button>
          <button className={btn} disabled={pending} onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </>
      ) : (
        <button
          className="rounded border border-hairline px-2.5 py-1 text-[12px] text-red transition-colors hover:border-red"
          disabled={pending}
          onClick={() => setConfirming(true)}
        >
          Delete
        </button>
      )}
    </div>
  );
}
