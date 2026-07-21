"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enrollTotp, verifyTotpEnrollment, removeTotp } from "@/lib/mfa-actions";

export interface TotpFactor {
  id: string;
  friendlyName: string;
}

type Enrolling = { factorId: string; qr: string; secret: string };

export default function MfaManager({ factors }: { factors: TotpFactor[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const begin = () =>
    start(async () => {
      setError("");
      const res = await enrollTotp();
      if (res.ok) setEnrolling({ factorId: res.factorId, qr: res.qr, secret: res.secret });
      else setError(res.error);
    });

  const confirm = () =>
    start(async () => {
      setError("");
      if (!enrolling) return;
      const res = await verifyTotpEnrollment(enrolling.factorId, code);
      if (res.ok) {
        setEnrolling(null);
        setCode("");
        router.refresh();
      } else {
        setError(res.error ?? "Invalid code.");
      }
    });

  const remove = (factorId: string) =>
    start(async () => {
      setError("");
      await removeTotp(factorId);
      router.refresh();
    });

  const btn =
    "rounded bg-red px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40";
  const ghost =
    "rounded border border-hairline px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted disabled:opacity-40";

  // Already has a verified authenticator.
  if (factors.length > 0 && !enrolling) {
    return (
      <div className="mt-6 border-t border-hairline pt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[16px] font-medium text-ink">Authenticator app</p>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              Enabled — you&apos;ll enter a code from your app at sign-in.
            </p>
          </div>
          <button
            className={ghost}
            disabled={pending}
            onClick={() => remove(factors[0].id)}
          >
            {pending ? "Removing…" : "Remove"}
          </button>
        </div>
        {error && <p className="mt-3 text-[13px] text-red">{error}</p>}
      </div>
    );
  }

  // Mid-enrollment: show QR + secret + code entry.
  if (enrolling) {
    return (
      <div className="mt-6 border-t border-hairline pt-6">
        <p className="text-[16px] font-medium text-ink">Scan this in your app</p>
        <p className="mt-1 text-[14px] text-ink-muted">
          Use Google Authenticator, 1Password, Authy, etc. Then enter the 6-digit code.
        </p>
        <div
          className="mt-4 inline-block rounded border border-hairline bg-white p-3 [&_svg]:h-40 [&_svg]:w-40"
          dangerouslySetInnerHTML={{ __html: enrolling.qr }}
        />
        <p className="mt-3 text-[13px] text-ink-secondary">
          Or enter this key manually:{" "}
          <code className="break-all font-mono text-ink">{enrolling.secret}</code>
        </p>
        <div className="mt-4 flex items-center gap-3">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-32 rounded border border-hairline bg-surface-sunk px-4 py-2.5 text-center font-mono text-[16px] tracking-[0.3em] text-ink focus:border-ink focus:outline-none"
          />
          <button className={btn} disabled={pending || code.length < 6} onClick={confirm}>
            {pending ? "Verifying…" : "Verify & enable"}
          </button>
          <button
            className={ghost}
            disabled={pending}
            onClick={() => {
              setEnrolling(null);
              setCode("");
              setError("");
            }}
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-3 text-[13px] text-red">{error}</p>}
      </div>
    );
  }

  // No factor yet.
  return (
    <div className="mt-6 border-t border-hairline pt-6">
      <p className="text-[16px] font-medium text-ink">Authenticator app</p>
      <p className="mt-0.5 text-[14px] text-ink-muted">
        Add a second step at sign-in using a TOTP app for extra account security.
      </p>
      <button className={`${btn} mt-4`} disabled={pending} onClick={begin}>
        {pending ? "Starting…" : "Enable two-factor auth"}
      </button>
      {error && <p className="mt-3 text-[13px] text-red">{error}</p>}
    </div>
  );
}
