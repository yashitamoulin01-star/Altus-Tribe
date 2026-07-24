"use client";

import React, { useState } from "react";

export type PhoneTheme = "dark" | "white" | "red";

interface PhoneThemeWrapperProps {
  children: React.ReactNode;
  initialTheme?: PhoneTheme;
}

export default function PhoneThemeWrapper({
  children,
  initialTheme = "dark",
}: PhoneThemeWrapperProps) {
  const [theme, setTheme] = useState<PhoneTheme>(initialTheme);

  const themeStyles: Record<PhoneTheme, { bg: string; container: string; border: string; text: string }> = {
    dark: {
      bg: "bg-[#0c0a0e]",
      container: "bg-[#14101b] text-white shadow-2xl shadow-black/80",
      border: "border-zinc-800",
      text: "text-white",
    },
    white: {
      bg: "bg-slate-100",
      container: "bg-white text-zinc-900 shadow-2xl shadow-slate-300",
      border: "border-slate-200",
      text: "text-zinc-900",
    },
    red: {
      bg: "bg-[#1a0505]",
      container: "bg-[#280a0a] text-white shadow-2xl shadow-red-950/60",
      border: "border-red-900/60",
      text: "text-white",
    },
  };

  const current = themeStyles[theme];

  return (
    <div className={`min-h-screen py-6 px-3 sm:px-6 transition-colors duration-300 ${current.bg}`}>
      {/* Phone Theme Control Bar */}
      <div className="mx-auto mb-6 flex max-w-sm items-center justify-between rounded-full border border-hairline/80 bg-surface/95 px-4 py-2 shadow-lg backdrop-blur-md">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Phone Theme:</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              theme === "dark"
                ? "bg-zinc-800 text-white shadow-sm ring-1 ring-white/20"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            🌙 Dark
          </button>

          <button
            type="button"
            onClick={() => setTheme("white")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              theme === "white"
                ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-300"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            ☀️ White
          </button>

          <button
            type="button"
            onClick={() => setTheme("red")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              theme === "red"
                ? "bg-red text-white shadow-sm ring-1 ring-red-400/50"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            🔴 Red
          </button>
        </div>
      </div>

      {/* Phone Mockup Frame Container */}
      <div className="mx-auto max-w-[480px]">
        <div
          className={`relative overflow-hidden rounded-[2.5rem] border-4 ${current.border} ${current.container} transition-all duration-300`}
        >
          {/* Phone Speaker Notch */}
          <div className="mx-auto my-3 h-4 w-28 rounded-full bg-black/40 backdrop-blur-sm" />

          {/* Screen Content */}
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
