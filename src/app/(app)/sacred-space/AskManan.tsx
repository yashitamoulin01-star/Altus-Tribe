"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { askManan } from "./actions";
import { MANAN_WHATSAPP_NUMBER, MANAN_WHATSAPP_PREFILL } from "@/lib/settings-meta";

// Reach Manan Vasa / Team TWO ways: in-app (opens/creates the support thread the
// team replies to from the admin inbox) OR WhatsApp. Honest routing — the in-app
// button says "Team" because a founding-admin/team member answers.
const waHref = `https://wa.me/${MANAN_WHATSAPP_NUMBER}?text=${encodeURIComponent(MANAN_WHATSAPP_PREFILL)}`;

export default function AskManan() {
  const router = useRouter();
  const [pending, start] = useTransition();

  const openInApp = () =>
    start(async () => {
      const { id } = await askManan();
      router.push(id ? `/messages/${id}` : "/messages");
    });

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={openInApp}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-red px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-red-hover disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 21l1.9-5.6a8.5 8.5 0 0 1-.9-3.9A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z" />
        </svg>
        {pending ? "Opening…" : "Message Manan Vasa / Team in-app"}
      </button>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-white px-5 py-3 text-[15px] font-semibold text-ink transition-colors hover:border-hairline-bright hover:bg-surface-sunk dark:bg-surface"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.16L2 22l4.95-1.3A9.9 9.9 0 1 0 12.04 2Zm0 18.05a8.15 8.15 0 0 1-4.15-1.14l-.3-.18-2.94.77.78-2.86-.2-.3a8.16 8.16 0 1 1 7.01 3.95Zm4.5-6.1c-.25-.12-1.46-.72-1.68-.8-.23-.08-.4-.12-.56.13-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06a6.68 6.68 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62 1.53.66 2.13.72 2.9.6.46-.06 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
        </svg>
        WhatsApp
      </a>
    </div>
  );
}
