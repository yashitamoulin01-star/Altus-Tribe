"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMemberRole } from "../../actions";
import type { Role } from "@/lib/admin";

// Privileged role change (§5/§6). Grants or revokes administrator access via the
// canonical setMemberRole server action (which validates the acting admin, the
// role enum, and guards the last-admin case). Rendered for admins only.
export default function RoleControl({ id, role }: { id: string; role: Role }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();

  const isAdmin = role === "admin";
  const target: Role = isAdmin ? "member" : "admin";

  const change = () =>
    start(async () => {
      setError(undefined);
      const res = await setMemberRole(id, target);
      if (!res.ok) {
        setError(res.error ?? "Couldn't update the role.");
        setConfirming(false);
        return;
      }
      setConfirming(false);
      router.refresh();
    });

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-ink-secondary">
            {isAdmin ? "Revoke admin access?" : "Grant admin access?"}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={change}
            className="rounded bg-red px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-red-hover disabled:opacity-50"
          >
            {pending ? "…" : "Confirm"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(false)}
            className="rounded border border-hairline px-3 py-1.5 text-[12px] text-ink-secondary transition-colors hover:border-hairline-bright"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-[12px] text-red">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={
          isAdmin
            ? "rounded border border-hairline px-4 py-2 text-[13px] text-ink-secondary transition-colors hover:border-hairline-bright"
            : "rounded bg-red px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-red-hover"
        }
      >
        {isAdmin ? "Revoke administrator access" : "Grant administrator access"}
      </button>
      {error && <p className="text-[12px] text-red">{error}</p>}
    </div>
  );
}
