"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addInvite, removeInvite } from "../actions";

type Invite = { email: string; note: string | null; createdAt: string };

export default function InviteManager({ initial }: { initial: Invite[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const inputCls =
    "h-10 w-full rounded-lg border border-hairline bg-surface-sunk px-3 text-[14px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none";

  const add = () =>
    start(async () => {
      setMsg(null);
      const r = await addInvite(email, note);
      if (r.ok) {
        setEmail("");
        setNote("");
        setMsg({ ok: true, text: "Invited." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: r.error ?? "Couldn't add." });
      }
    });

  const remove = (e: string) =>
    start(async () => {
      await removeInvite(e);
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-hairline bg-surface p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="inv-email" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">Email</label>
            <input id="inv-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={inputCls} />
          </div>
          <div>
            <label htmlFor="inv-note" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">Note (optional)</label>
            <input id="inv-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. CQ-14 referral" className={inputCls} />
          </div>
          <button
            type="button"
            onClick={add}
            disabled={pending || !email.trim()}
            className="h-10 rounded-lg bg-red px-5 text-[14px] font-medium text-white transition-colors hover:bg-red-hover disabled:opacity-40"
          >
            {pending ? "Adding…" : "Invite"}
          </button>
        </div>
        {msg && <p className={`mt-2 text-[13px] ${msg.ok ? "text-ink-secondary" : "text-red"}`}>{msg.ok ? "✓ " : ""}{msg.text}</p>}
      </div>

      <div className="rounded-xl border border-hairline">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">{initial.length} invited</p>
        </div>
        {initial.length === 0 ? (
          <p className="px-4 py-10 text-center text-[14px] text-ink-secondary">No invites yet. Add an email above to let someone register.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {initial.map((inv) => (
              <li key={inv.email} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-ink">{inv.email}</p>
                  {inv.note && <p className="truncate text-[12px] text-ink-muted">{inv.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => remove(inv.email)}
                  disabled={pending}
                  className="shrink-0 rounded border border-hairline px-2.5 py-1 text-[12px] text-red transition-colors hover:border-red disabled:opacity-40"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
