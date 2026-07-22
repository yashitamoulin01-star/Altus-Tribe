"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs/legacy";
import SubmitButton from "../SubmitButton";
import { fieldClass, labelClass } from "../AuthShell";

function clerkMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const first = (err as { errors?: { message?: string; longMessage?: string }[] }).errors?.[0];
    return first?.longMessage || first?.message || "Couldn't update your password. Please try again.";
  }
  return "Couldn't update your password. Please try again.";
}

export default function ResetForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || pending) return;
    setPending(true);
    setError(undefined);
    try {
      const res = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.push("/login?reset_success=1");
        router.refresh();
        return;
      }
      setError("Couldn't complete the reset. Please try again.");
      setPending(false);
    } catch (err) {
      setError(clerkMessage(err));
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="code" className={labelClass}>
          Reset code
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          placeholder="123456"
          className={fieldClass}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className={fieldClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p className="text-[14px] text-red">{error}</p>}

      <SubmitButton pending={pending}>Update password</SubmitButton>
    </form>
  );
}
