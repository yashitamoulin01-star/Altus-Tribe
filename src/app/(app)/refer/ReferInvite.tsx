"use client";

import { useState } from "react";

// Refer Someone (#134). A member invites a peer into the Tribe by sharing an
// invite link to /signup via WhatsApp / Email / copied link. The absolute URL is
// composed on the client at click time so it's correct on any host.
export default function ReferInvite() {
  const [copied, setCopied] = useState(false);

  const inviteUrl = () => `${window.location.origin}/signup`;
  const message = (url: string) =>
    `I think you belong in Altus Tribe — a private community of productive people. Come take a look: ${url}`;

  const openWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message(inviteUrl()))}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(
      "An invitation to Altus Tribe",
    )}&body=${encodeURIComponent(message(inviteUrl()))}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the WhatsApp/Email paths still work */
    }
  };

  const cls =
    "rounded border border-hairline px-5 py-3 text-[15px] text-ink transition-colors hover:border-ink-muted";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={`${cls} bg-red text-paper hover:bg-red-hover`} onClick={openWhatsApp}>
        Invite on WhatsApp
      </button>
      <button type="button" className={cls} onClick={openEmail}>
        Invite by Email
      </button>
      <button type="button" className={cls} onClick={copy}>
        {copied ? "Copied ✓" : "Copy invite link"}
      </button>
    </div>
  );
}
