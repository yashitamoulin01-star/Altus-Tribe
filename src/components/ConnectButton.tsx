"use client";

import { useState, useTransition } from "react";
import {
  sendConnectionRequest,
  respondToConnection,
  removeConnection,
} from "@/app/(app)/connections/actions";
import type { ConnectionState } from "@/lib/connections";

// State-aware connection control (Phase 5, Tribe). Reused on member cards, the
// profile action bar, and the requests inbox. Optimistically flips local state;
// the server action re-checks auth + RLS.

export default function ConnectButton({
  profileId,
  initialState,
  allowRemove = false,
}: {
  profileId?: string;
  initialState: ConnectionState;
  allowRemove?: boolean;
}) {
  const [state, setState] = useState<ConnectionState>(initialState);
  const [pending, start] = useTransition();

  if (!profileId || state === "self") return null;

  const run = (fn: () => Promise<unknown>, next: ConnectionState) =>
    start(async () => {
      const prev = state;
      setState(next);
      const res = (await fn()) as { ok: boolean };
      if (!res?.ok) setState(prev);
    });

  const base =
    "rounded-xl px-4 py-2 text-[13px] font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm";
  const solid = `${base} bg-red text-white hover:bg-red-hover active:scale-[0.98] shadow-red/20 hover:shadow-md hover:shadow-red/30`;
  const outline = `${base} border border-hairline bg-surface/80 text-ink hover:border-hairline-bright hover:bg-surface-hover hover:text-ink`;

  if (state === "none") {
    return (
      <button type="button" disabled={pending} className={solid}
        onClick={() => run(() => sendConnectionRequest(profileId), "outgoing")}>
        {pending ? "…" : "+ Connect"}
      </button>
    );
  }

  if (state === "outgoing") {
    return (
      <button type="button" disabled={pending} className={outline}
        onClick={() => run(() => removeConnection(profileId), "none")}>
        Requested <span className="text-ink-muted">· Withdraw</span>
      </button>
    );
  }

  if (state === "incoming") {
    return (
      <span className="flex gap-2">
        <button type="button" disabled={pending} className={solid}
          onClick={() => run(() => respondToConnection(profileId, true), "connected")}>
          Accept
        </button>
        <button type="button" disabled={pending} className={outline}
          onClick={() => run(() => respondToConnection(profileId, false), "none")}>
          Decline
        </button>
      </span>
    );
  }

  // connected
  return (
    <span className="flex items-center gap-2">
      <span className="rounded-xl border border-hairline/80 bg-red/10 px-3.5 py-1.5 font-mono text-[12px] font-medium text-red flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-red" /> Connected
      </span>
      {allowRemove && (
        <button type="button" disabled={pending} className="text-[12px] text-ink-muted transition-colors hover:text-red p-1"
          onClick={() => run(() => removeConnection(profileId), "none")}>
          Remove
        </button>
      )}
    </span>
  );
}

