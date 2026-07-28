"use client";

import { useState, useTransition } from "react";
import { requestAccess } from "./actions";

// Step 1–2. Email-only. On submit we ALWAYS show the same generic confirmation,
// so the screen can never be used to tell whether an email is on the allowlist.
export default function RequestAccessForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    start(async () => {
      const r = await requestAccess(email.trim());
      setSent(r.message);
    });
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-red/10 text-red">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-ink">Check your inbox</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-secondary">{sent}</p>
        <button
          type="button"
          onClick={() => { setSent(null); setEmail(""); }}
          className="mt-4 text-[13px] font-semibold text-red underline-offset-2 hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Registered email
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-xl border border-hairline bg-white px-4 py-3.5 text-[15px] text-ink placeholder:text-ink-muted transition-colors focus:border-red/40 focus:outline-none focus:ring-4 focus:ring-red/10"
        />
      </label>
      <button
        type="submit"
        disabled={pending || !email.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red px-6 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send my sign-in link"}
      </button>
      <p className="text-[12px] leading-relaxed text-ink-muted">
        Access is limited to Altus Conclave participants. If your email is on the list,
        a secure link arrives within a few minutes.
      </p>
    </form>
  );
}
