"use client";

import React from "react";
import Link from "next/link";

interface SectionCardItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
}

const SECTION_CARDS: SectionCardItem[] = [
  {
    id: "forms",
    title: "Forms and Agreements",
    subtitle: "Onboarding, Consent, Agreements & Habits ECG",
    href: "/onboarding",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    id: "pre-shastra",
    title: "Pre Productivity Shastra",
    subtitle: "Workshop tools, Expectations, Totality & Sales",
    href: "/campus",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "shastra-suite",
    title: "Productivity Shastra",
    subtitle: "Your full productivity suite",
    href: "/home",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    id: "feedback",
    title: "Feedback and Queries",
    subtitle: "Share Feedback & raise Queries",
    href: "/messages",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "tutorials",
    title: "Tutorials",
    subtitle: "Learn how to use the tools",
    href: "/campus",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "highlights",
    title: "Session Highlights",
    subtitle: "Highlights of your Sessions",
    href: "/sacred-space",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    id: "hh-calls",
    title: "HH Call Recording",
    subtitle: "Hand-Holding Call Recordings",
    href: "/connections",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    id: "post-shastra",
    title: "Post Productivity Shastra",
    subtitle: "Report Card & Workshop Evaluations",
    href: "/account",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    id: "certificate",
    title: "My Certificate",
    subtitle: "View & download your completion Certificate",
    href: "/account",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
  },
];

export default function ShastraSectionGrid() {
  return (
    <div className="space-y-4 my-8">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
          CHOOSE A SECTION TO GET STARTED
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTION_CARDS.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="group relative flex items-center justify-between rounded-2xl border border-hairline/80 bg-surface p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-red/40 hover:bg-surface-hover hover:shadow-xl hover:shadow-red/5 cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              {/* Red Icon Tile (Screenshot Style) */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red to-red-hover text-white shadow-md shadow-red/20 transition-transform duration-300 group-hover:scale-105">
                {card.icon}
              </div>

              {/* Text Meta */}
              <div className="min-w-0 pr-2">
                <h3 className="truncate text-[16px] font-bold tracking-tight text-ink group-hover:text-red transition-colors">
                  {card.title}
                </h3>
                <p className="line-clamp-2 text-[13px] leading-snug text-ink-muted">
                  {card.subtitle}
                </p>
              </div>
            </div>

            {/* Right Arrow Chevron (Screenshot Style) */}
            <div className="shrink-0 text-ink-muted transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-red">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
