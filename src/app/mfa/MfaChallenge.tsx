"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyMfaChallenge } from "@/lib/mfa-actions";
import { signOut } from "@/app/(auth)/actions";

export default function MfaChallenge() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = () =>
    start(async () => {
      setError("");
      const res = await verifyMfaChallenge(code);
      if (res.ok) router.replace("/home");
      else setError(res.error ?? "Invalid code.");
    });

  return (
    <div className="w-full max-w-[360px]">
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && code.length === 6) submit();
        }}
        className="w-full rounded border border-hairline bg-surface-sunk px-4 py-3 text-center font-mono text-[20px] tracking-[0.4em] text-ink focus:border-ink focus:outline-none"
      />
      {error && <p className="mt-3 text-center text-[13px] text-red">{error}</p>}
      <button
        onClick={submit}
        disabled={pending || code.length < 6}
        className="mt-4 w-full rounded bg-red px-5 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
      >
        {pending ? "Verifying…" : "Verify"}
      </button>
      <form action={signOut} className="mt-4 text-center">
        <button type="submit" className="text-[13px] text-ink-muted hover:text-ink">
          Sign out
        </button>
      </form>
    </div>
  );
}
