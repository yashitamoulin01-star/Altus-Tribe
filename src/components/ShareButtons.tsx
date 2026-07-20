"use client";

import { useState } from "react";

// Share a member feature by WhatsApp / Email / copied link (#106, #107), plus an
// optional "Download PDF" that prints the current page to PDF (#105). The absolute
// URL is composed on the client at click time, so it's correct on any host
// (local, preview, prod) with no SSR/hydration mismatch.
export default function ShareButtons({
  slug,
  name,
  showPdf = false,
}: {
  slug: string;
  name: string;
  showPdf?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const featureUrl = () => `${window.location.origin}/m/${slug}`;
  const message = (url: string) => `${name} on Altus Tribe — ${url}`;

  const openWhatsApp = () => {
    const url = featureUrl();
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message(url))}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openEmail = () => {
    const url = featureUrl();
    window.location.href = `mailto:?subject=${encodeURIComponent(
      `${name} — Altus Tribe`,
    )}&body=${encodeURIComponent(message(url))}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(featureUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the WhatsApp/Email paths still work */
    }
  };

  const cls =
    "rounded border border-hairline px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button type="button" className={cls} onClick={openWhatsApp}>
        WhatsApp
      </button>
      <button type="button" className={cls} onClick={openEmail}>
        Email
      </button>
      <button type="button" className={cls} onClick={copy}>
        {copied ? "Copied ✓" : "Copy link"}
      </button>
      {showPdf && (
        <button type="button" className={cls} onClick={() => window.print()}>
          Download PDF
        </button>
      )}
    </div>
  );
}
