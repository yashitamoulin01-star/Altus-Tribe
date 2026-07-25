"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiGrid, FiX } from "react-icons/fi";
import { ecosystemNavigation, type NavLink } from "@/lib/navigation";

// LEVEL 2 navigation. A subtle header trigger (between search and the primary nav)
// that expands ONE white surface DOWNWARD from under the header — never a left
// sidebar, never a giant Bento grid. Rows are icon + title + one-line description.
// Closes on Escape, outside-click, route change, or link click. Reduced-motion is
// honoured (the CSS transition collapses to ~0ms via the global media query).

function Row({ item, onNavigate }: { item: NavLink; onNavigate: () => void }) {
  const Icon = item.icon;
  const base =
    "group flex items-start gap-3 rounded-lg px-2.5 py-2 transition-colors";

  if (item.soon) {
    return (
      <div className={`${base} cursor-default`}>
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunk text-ink-muted">
          <Icon size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="text-[13.5px] font-semibold text-ink-muted">{item.label}</span>
            <span className="rounded bg-surface-sunk px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted">Soon</span>
          </span>
          {item.description && <span className="mt-0.5 block text-[12px] text-ink-muted">{item.description}</span>}
        </span>
      </div>
    );
  }

  const inner = (
    <>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunk text-ink-secondary transition-colors group-hover:bg-red/10 group-hover:text-red">
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-[13.5px] font-semibold text-ink transition-colors group-hover:text-red">
          {item.label}
          {item.external && <span aria-hidden className="text-[11px]">↗</span>}
        </span>
        {item.description && <span className="mt-0.5 block text-[12px] leading-snug text-ink-muted">{item.description}</span>}
      </span>
    </>
  );

  return item.external ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={`${base} hover:bg-red/5`}>
      {inner}
    </a>
  ) : (
    <Link href={item.href!} onClick={onNavigate} className={`${base} hover:bg-red/5`}>
      {inner}
    </Link>
  );
}

export default function EcosystemMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on route change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  // Escape + outside-click while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Explore Altus Tribe"
        title="Explore Altus Tribe"
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          open ? "bg-red/10 text-red" : "text-ink-muted hover:bg-surface-sunk hover:text-ink"
        }`}
      >
        <span className={`transition-transform duration-300 ${open ? "rotate-90" : ""}`}>
          {open ? <FiX size={18} /> : <FiGrid size={18} />}
        </span>
      </button>

      {/* Downward mega-menu — fixed under the header, animated via grid-rows + opacity. */}
      <div
        className={`fixed inset-x-0 top-14 z-30 grid transition-[grid-template-rows,opacity] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] sm:top-16 ${
          open ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden border-b border-hairline bg-white shadow-lg dark:bg-surface">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-6 px-6 py-8 md:grid-cols-3 xl:grid-cols-5 xl:px-8">
            {ecosystemNavigation.map((section) => (
              <section key={section.title}>
                <h3 className="mb-1.5 px-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">{section.title}</h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <Row key={item.label + (item.href ?? "")} item={item} onNavigate={() => setOpen(false)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
