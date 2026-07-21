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
    "rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50";
  const solid = `${base} bg-red text-paper hover:bg-red-hover`;
  const outline = `${base} border border-hairline text-ink hover:border-ink-muted`;

  if (state === "none") {
    return (
      <button type="button" disabled={pending} className={solid}
        onClick={() => run(() => sendConnectionRequest(profileId), "outgoing")}>
        Connect
      </button>
    );
  }

  if (state === "outgoing") {
    return (
      <button type="button" disabled={pending} className={outline}
        onClick={() => run(() => removeConnection(profileId), "none")}>
        Requested · Withdraw
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
      <span className="rounded-lg border border-hairline px-3 py-1.5 text-[13px] text-positive">
        ✓ Connected
      </span>
      {allowRemove && (
        <button type="button" disabled={pending} className="text-[13px] text-ink-muted transition-colors hover:text-red"
          onClick={() => run(() => removeConnection(profileId), "none")}>
          Remove
        </button>
      )}
    </span>
  );
}
