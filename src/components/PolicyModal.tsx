"use client";

import { useEffect, useState } from "react";

// Tabbed legal modal (Terms / Privacy / Refund) opened from the global Footer.
// PLACEHOLDER copy — the owner will supply the final legal text. Kept in one
// place so swapping in the real policies later is a single-file edit.
type PolicyTab = "terms" | "privacy" | "refund";

const TABS: { id: PolicyTab; label: string }[] = [
  { id: "terms", label: "Terms of Use" },
  { id: "privacy", label: "Privacy Policy" },
  { id: "refund", label: "Refund Policy" },
];

const PLACEHOLDER: Record<PolicyTab, { heading: string; body: string[] }> = {
  terms: {
    heading: "Terms of Use",
    body: [
      "Placeholder — final Terms of Use to be supplied by Altus Corp / CA Manan Vasa.",
      "Altus Tribe is an invitation-only community. By using it you agree to engage respectfully with fellow participants and to keep shared contact details confidential.",
    ],
  },
  privacy: {
    heading: "Privacy Policy",
    body: [
      "Placeholder — final Privacy Policy to be supplied by Altus Corp / CA Manan Vasa.",
      "We store only the profile information you provide. Sensitive fields default to hidden, and internal CRM notes are never shown to other participants.",
    ],
  },
  refund: {
    heading: "Refund Policy",
    body: [
      "Placeholder — final Refund Policy to be supplied by Altus Corp / CA Manan Vasa.",
    ],
  },
};

export default function PolicyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<PolicyTab>("terms");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const content = PLACEHOLDER[tab];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Policies"
    >
      <button
        type="button"
        aria-label="Close policies"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
        tabIndex={-1}
      />
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <p className="text-[15px] font-semibold text-ink">Policies</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex gap-1 border-b border-hairline px-3">
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  on ? "text-red" : "text-ink-muted hover:text-ink"
                }`}
              >
                {t.label}
                {on && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-red" />}
              </button>
            );
          })}
        </div>

        <div className="overflow-y-auto px-5 py-5">
          <h2 className="text-[16px] font-semibold text-ink">{content.heading}</h2>
          <div className="mt-3 space-y-3">
            {content.body.map((p, i) => (
              <p key={i} className="text-[13.5px] leading-relaxed text-ink-secondary">
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
