"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Global search — routes into Explore with the query. Explore owns the actual
// filtering; this is the dashboard entry point.
export default function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim();
        router.push(t ? `/explore?q=${encodeURIComponent(t)}` : "/explore");
      }}
      className="relative hidden sm:block"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search members, companies…"
        aria-label="Search the Tribe"
        className="h-10 w-56 rounded-lg border border-hairline bg-surface-sunk pl-9 pr-3 text-[14px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none lg:w-64"
      />
      <svg
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </form>
  );
}
