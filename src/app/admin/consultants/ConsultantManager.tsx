"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMemberRole } from "../actions";
import type { RosterMember } from "@/lib/admin";

// Add Consultants (#175). Promote a member to `consultant` or demote back to
// `member`. Admins are shown but not demotable here.
export default function ConsultantManager({ roster }: { roster: RosterMember[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  const consultants = roster.filter((m) => m.role === "consultant");
  const admins = roster.filter((m) => m.role === "admin");

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roster
      .filter((m) => m.role === "member")
      .filter((m) => (q ? m.fullName.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [roster, query]);

  const promote = (id: string) =>
    startTransition(async () => {
      await setMemberRole(id, "consultant");
      router.refresh();
    });
  const demote = (id: string) =>
    startTransition(async () => {
      await setMemberRole(id, "member");
      router.refresh();
    });

  const chip =
    "rounded border border-hairline px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40";

  return (
    <div className="space-y-10">
      <section>
        <p className="kicker mb-3">Current consultants</p>
        {admins.length + consultants.length === 0 ? (
          <p className="text-[15px] text-ink-secondary">No consultants yet.</p>
        ) : (
          <ul className="divide-y divide-hairline rounded border border-hairline">
            {admins.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-[15px] text-ink">{m.fullName}</span>
                <span className="rounded bg-surface-sunk px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                  admin
                </span>
              </li>
            ))}
            {consultants.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-[15px] text-ink">{m.fullName}</span>
                <button
                  className={`${chip} text-red hover:border-red`}
                  disabled={pending}
                  onClick={() => demote(m.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="kicker mb-3">Add a consultant</p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members…"
          className="mb-3 w-full max-w-md rounded border border-hairline bg-surface-sunk px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
        />
        <ul className="divide-y divide-hairline rounded border border-hairline">
          {candidates.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-[15px] text-ink">{m.fullName}</span>
              <button
                className={`${chip} text-ink hover:border-ink-muted`}
                disabled={pending}
                onClick={() => promote(m.id)}
              >
                Make consultant
              </button>
            </li>
          ))}
          {candidates.length === 0 && (
            <li className="px-4 py-6 text-center text-[14px] text-ink-secondary">
              No members match.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
