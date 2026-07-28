"use client";

import { useState } from "react";
import { PS_APP_URL } from "@/lib/settings-meta";

// Refer Someone. The Tribe itself is invitation-only, but anyone can be invited
// to Productivity Shastra — so referrals point at the PS app, not the Tribe.
export default function ReferInvite() {
  const [copied, setCopied] = useState(false);

  const inviteUrl = () => PS_APP_URL;
  const message = (url: string) =>
    `I use Productivity Shastra to get more done — I think you'd love it. Come check it out: ${url}`;

  const openWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message(inviteUrl()))}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(
      "An invitation to Productivity Shastra",
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
