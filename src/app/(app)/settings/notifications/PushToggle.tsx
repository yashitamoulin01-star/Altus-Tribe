"use client";

import { useEffect, useState } from "react";
import {
  disablePush,
  enablePush,
  getPushState,
  type PushState,
} from "@/lib/push/client";

// Per-device push opt-in (#155, P5 tail). Sits under the notification-category
// toggles: those choose *what* you're notified about; this chooses whether *this
// browser* also gets a system push when the app is closed. State is device-local
// (a PushManager subscription), so it's read on mount rather than from the DB.

function Toggle({
  on,
  disabled,
  onClick,
  label,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 disabled:opacity-40 ${
        on ? "bg-red" : "bg-surface-sunk border border-hairline"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow-sm transition-transform duration-150 ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

const HINT: Record<PushState, string> = {
  unsupported: "This browser doesn't support push notifications.",
  unconfigured: "Push delivery isn't enabled for this environment yet.",
  denied: "Notifications are blocked. Allow them in your browser settings, then retry.",
  off: "Get a notification on this device even when the app is closed.",
  on: "This device will receive push notifications.",
};

export default function PushToggle() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getPushState().then(setState);
  }, []);

  // Nothing to offer until we know the state; hide entirely when unsupported so
  // the settings page stays clean on browsers that can't do this.
  if (state === null || state === "unsupported") return null;

  const on = state === "on";
  const interactive = state === "on" || state === "off";

  const handle = async () => {
    setBusy(true);
    try {
      setState(on ? await disablePush() : await enablePush());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 flex items-start justify-between gap-6 border-t border-hairline py-5">
      <div>
        <p className="text-[17px] text-ink">Push on this device</p>
        <p className="mt-1 max-w-[42ch] text-[14px] leading-relaxed text-ink-muted">
          {HINT[state]}
        </p>
      </div>
      <Toggle
        on={on}
        disabled={busy || !interactive}
        onClick={handle}
        label="Push on this device"
      />
    </div>
  );
}
