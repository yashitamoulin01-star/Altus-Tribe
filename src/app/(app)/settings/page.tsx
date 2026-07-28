"use client";

import { useState } from "react";
import Link from "next/link";

type ThemeMode = "dark" | "light" | "system";

export default function SettingsPage() {
  // Read the theme the pre-paint init script already applied (no effect/flash).
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("altus-theme") as ThemeMode) || "light";
  });

  // Light is the default; dark applies `.dark` + data-theme="dark" (mirrors the
  // pre-paint init in layout.tsx). Light removes both so :root (light) applies.
  const setDark = (dark: boolean) => {
    // color-scheme follows the `.dark` class via CSS (html.dark { color-scheme: dark }).
    const r = document.documentElement;
    if (dark) {
      r.classList.add("dark");
      r.setAttribute("data-theme", "dark");
    } else {
      r.classList.remove("dark");
      r.removeAttribute("data-theme");
    }
  };

  const applyTheme = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem("altus-theme", mode);
    if (mode === "system") {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    } else {
      setDark(mode === "dark");
    }
  };

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 pt-8 pb-28 sm:px-10 space-y-8">
      <header className="border-b border-hairline/80 pb-6">
        <p className="kicker mb-2 text-red font-semibold">Preferences</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Account Settings
        </h1>
        <p className="mt-2 text-[14px] text-ink-secondary">
          Customize your experience, manage display themes, and configure privacy controls.
        </p>
      </header>

      {/* Theme Selector Section */}
      <section className="rounded-2xl border border-hairline/80 bg-surface/80 p-6 backdrop-blur-md space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Appearance & Theme</h2>
          <p className="text-[13px] text-ink-muted mt-1">Select your preferred viewing experience. Dark mode is optimized for high contrast.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { mode: "light" as ThemeMode, label: "Light (Default)", desc: "Clean Monochrome" },
            { mode: "dark" as ThemeMode, label: "Dark", desc: "Obsidian & Red" },
            { mode: "system" as ThemeMode, label: "System", desc: "Sync Device" },
          ].map((item) => {
            const active = theme === item.mode;
            return (
              <button
                key={item.mode}
                type="button"
                onClick={() => applyTheme(item.mode)}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                  active
                    ? "border-red bg-red/10 shadow-md shadow-red/10"
                    : "border-hairline bg-surface-sunk/60 hover:border-hairline-bright hover:bg-surface-hover"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[14px] font-semibold ${active ? "text-red" : "text-ink"}`}>{item.label}</span>
                  {active && <span className="h-2 w-2 rounded-full bg-red red-dot-pulse" />}
                </div>
                <span className="text-[12px] text-ink-muted">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Preferences Links */}
      <section className="space-y-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted font-semibold px-1">
          Preferences & Controls
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/settings/notifications"
            className="group rounded-2xl border border-hairline/80 bg-surface/80 p-5 backdrop-blur-md transition-all hover:border-red/40 hover:bg-surface-hover shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">🔔</span>
              <span className="font-mono text-xs text-red opacity-0 transition-opacity group-hover:opacity-100">Configure →</span>
            </div>
            <h3 className="text-[16px] font-semibold text-ink transition-colors group-hover:text-red">Notifications</h3>
            <p className="mt-1 text-[13px] text-ink-muted">Manage push alerts, email digest, and message sounds.</p>
          </Link>

          <Link
            href="/settings/security"
            className="group rounded-2xl border border-hairline/80 bg-surface/80 p-5 backdrop-blur-md transition-all hover:border-red/40 hover:bg-surface-hover shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">🔒</span>
              <span className="font-mono text-xs text-red opacity-0 transition-opacity group-hover:opacity-100">Manage →</span>
            </div>
            <h3 className="text-[16px] font-semibold text-ink transition-colors group-hover:text-red">Security</h3>
            <p className="mt-1 text-[13px] text-ink-muted">Two-factor authentication, session control, and privacy.</p>
          </Link>

          <Link
            href="/account/edit"
            className="group rounded-2xl border border-hairline/80 bg-surface/80 p-5 backdrop-blur-md transition-all hover:border-red/40 hover:bg-surface-hover shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">👤</span>
              <span className="font-mono text-xs text-red opacity-0 transition-opacity group-hover:opacity-100">Edit →</span>
            </div>
            <h3 className="text-[16px] font-semibold text-ink transition-colors group-hover:text-red">Feature Profile</h3>
            <p className="mt-1 text-[13px] text-ink-muted">Update identity, social links, portfolio brochures, and privacy.</p>
          </Link>

          <Link
            href="/refer"
            className="group rounded-2xl border border-hairline/80 bg-surface/80 p-5 backdrop-blur-md transition-all hover:border-red/40 hover:bg-surface-hover shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">🎁</span>
              <span className="font-mono text-xs text-red opacity-0 transition-opacity group-hover:opacity-100">Invite →</span>
            </div>
            <h3 className="text-[16px] font-semibold text-ink transition-colors group-hover:text-red">Referral Program</h3>
            <p className="mt-1 text-[13px] text-ink-muted">Invite trusted founders and manage referral codes.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
