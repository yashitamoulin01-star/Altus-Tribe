"use client";

import { useState } from "react";
import PolicyModal from "./PolicyModal";

// Global site footer — the single copyright + Policies strip. Copyright on the
// left (exact brand line), a "Policies" link on the right that opens the tabbed
// legal modal. Token-based so it matches both light and dark themes.
export default function Footer({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <footer className={`w-full border-t border-hairline ${className}`}>
        <div className="mx-auto flex max-w-[1440px] flex-row items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <p className="min-w-0 text-left text-[11px] text-ink-muted sm:text-xs">
            © All Rights Reserved. 2026-2035.{" "}
            <span className="font-semibold text-ink-secondary">CA Manan Vasa</span>
            {" | "}
            <a
              href="https://www.altuscorp.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink-secondary underline-offset-2 hover:text-red hover:underline"
            >
              www.altuscorp.in
            </a>
          </p>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-ink-muted transition-colors hover:text-red sm:text-xs"
          >
            <svg className="h-3.5 w-3.5 opacity-70 transition-opacity group-hover:opacity-100" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
            Policies
          </button>
        </div>
      </footer>

      <PolicyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
