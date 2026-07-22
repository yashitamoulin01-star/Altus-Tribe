"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";

export interface CardNavItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  active: boolean;
}

interface CardNavProps {
  items: CardNavItem[];
  className?: string;
}

export default function CardNav({ items, className = "" }: CardNavProps) {
  return (
    <nav
      className={`fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-2xl border border-hairline/80 bg-surface/90 p-1.5 shadow-2xl backdrop-blur-xl transition-all duration-300 ${className}`}
      style={{ paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Navigation Dock"
    >
      <ul className="flex items-center justify-around gap-1">
        {items.map((item) => {
          return (
            <li key={item.href} className="relative flex-1">
              <Link
                href={item.href}
                className="relative flex flex-col items-center justify-center rounded-xl py-2 px-1 transition-colors group"
                aria-current={item.active ? "page" : undefined}
              >
                {/* Active Pill Motion Background */}
                {item.active && (
                  <motion.div
                    layoutId="cardnav-active-bg"
                    className="absolute inset-0 rounded-xl bg-surface-hover/80 border border-hairline"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}

                {/* Top Red Active Line */}
                {item.active && (
                  <motion.span
                    layoutId="cardnav-active-indicator"
                    className="absolute top-0.5 h-[2px] w-6 rounded-full bg-red shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}

                <span className="relative z-10 transition-transform duration-200 group-hover:scale-110">
                  {item.icon(item.active)}
                </span>
                <span
                  className={`relative z-10 mt-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    item.active ? "font-semibold text-ink" : "text-ink-muted group-hover:text-ink-secondary"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
