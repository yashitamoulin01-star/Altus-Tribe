"use client";

import { useState, useTransition } from "react";
import { savePrefs } from "../../notifications/actions";
import type { NotificationPrefs } from "@/lib/notifications";

// Notification Settings (#135, #152–154). Toggles now persist to
// notification_prefs via a server action (P5); push delivery is opt-in below.
type Pref = {
  key: keyof NotificationPrefs;
  label: string;
  hint: string;
};

const PREFS: Pref[] = [
  {
    key: "announcements",
    label: "Announcements",
    hint: "Notes from Manan Vasa and the team in Sacred Space.",
  },
  {
    key: "messages",
    label: "Direct messages",
    hint: "When a member messages you directly.",
  },
  {
    key: "mentions",
    label: "Mentions & referrals",
    hint: "When someone refers or tags you in the Tribe.",
  },
  {
    key: "monthlyDigest",
    label: "Monthly digest",
    hint: "A once-a-month summary of what you missed.",
  },
];

function Toggle({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ${
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

export default function NotificationSettings({
  initial,
}: {
  initial: NotificationPrefs;
}) {
  const [state, setState] = useState<NotificationPrefs>(initial);
  const [, startTransition] = useTransition();

  const toggle = (key: keyof NotificationPrefs) => {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    startTransition(() => {
      void savePrefs(next);
    });
  };

  return (
    <div className="divide-y divide-hairline">
      {PREFS.map((p) => (
        <div key={p.key} className="flex items-start justify-between gap-6 py-5">
          <div>
            <p className="text-[17px] text-ink">{p.label}</p>
            <p className="mt-1 max-w-[42ch] text-[14px] leading-relaxed text-ink-muted">
              {p.hint}
            </p>
          </div>
          <Toggle
            on={state[p.key]}
            onClick={() => toggle(p.key)}
            label={p.label}
          />
        </div>
      ))}
    </div>
  );
}
