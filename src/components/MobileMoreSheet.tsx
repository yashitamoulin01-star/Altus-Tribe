"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { ecosystemNavigation, type NavLink } from "@/lib/navigation";

// Mobile equivalent of the desktop Ecosystem trigger. A full-height bottom sheet
// (not a tiny dropdown). The sheet scrolls; the page underneath is locked while
// open. Consumes the SAME ecosystemNavigation config as the desktop mega-menu.

function Row({ item, onClose }: { item: NavLink; onClose: () => void }) {
  const Icon = item.icon;
  const base = "flex items-center gap-3 rounded-xl px-3 py-2.5";

  if (item.soon) {
    return (
      <div className={`${base}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunk text-ink-muted"><Icon size={17} /></span>
        <span className="flex-1 text-[14px] font-semibold text-ink-muted">{item.label}</span>
        <span className="rounded bg-surface-sunk px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted">Soon</span>
      </div>
    );
  }

  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunk text-ink-secondary"><Icon size={17} /></span>
      <span className="flex-1 text-[14px] font-semibold text-ink">{item.label}{item.external && <span aria-hidden className="ml-1 text-[12px] text-ink-muted">↗</span>}</span>
    </>
  );

  return item.external ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={`${base} active:bg-surface-sunk`}>{inner}</a>
  ) : (
    <Link href={item.href!} onClick={onClose} className={`${base} active:bg-surface-sunk`}>{inner}</Link>
  );
}

export default function MobileMoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Lock body scroll while the sheet is open + close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 sm:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      {/* Scrim */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Explore Altus Tribe"
        className={`absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[20px] border-t border-hairline bg-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:bg-surface ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="shrink-0 px-4 pt-2.5">
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-hairline-bright" />
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-[16px] font-bold text-ink">Explore Altus Tribe</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-sunk">
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {ecosystemNavigation.map((section) => (
            <section key={section.title} className="border-t border-hairline py-3 first:border-t-0">
              <h3 className="mb-1 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">{section.title}</h3>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Row key={item.label + (item.href ?? "")} item={item} onClose={onClose} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
