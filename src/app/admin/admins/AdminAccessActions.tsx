"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveAdminAccess, revokeAdminAccess } from "../actions";

// Grant or revoke another admin's access. Rendered only for approved admins.
export default function AdminAccessActions({
  id,
  approved,
  isSelf,
}: {
  id: string;
  approved: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: (id: string) => Promise<{ ok: boolean }>) =>
    startTransition(async () => {
      await fn(id);
      router.refresh();
    });

  if (isSelf) {
    return (
      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
        You
      </span>
    );
  }

  return approved ? (
    <button
      className="rounded border border-hairline px-3 py-1 text-[12px] text-ink-secondary transition-colors hover:border-ink-muted disabled:opacity-40"
      disabled={pending}
      onClick={() => run(revokeAdminAccess)}
    >
      Revoke access
    </button>
  ) : (
    <button
      className="rounded bg-red px-3 py-1 text-[12px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
      disabled={pending}
      onClick={() => run(approveAdminAccess)}
    >
      Approve access
    </button>
  );
}
