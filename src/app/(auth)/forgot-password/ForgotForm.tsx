"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs/legacy";
import SubmitButton from "../SubmitButton";
import { fieldClass, labelClass } from "../AuthShell";

function clerkMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const first = (err as { errors?: { message?: string; longMessage?: string }[] }).errors?.[0];
    return first?.longMessage || first?.message || "Couldn't send the reset code. Please try again.";
  }
  return "Couldn't send the reset code. Please try again.";
}

export default function ForgotForm() {
  const { isLoaded, signIn } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || pending) return;
    setPending(true);
    setError(undefined);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      // Code emailed — continue on the reset page (the Clerk sign-in attempt
      // persists on the client across this navigation).
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(clerkMessage(err));
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          className={fieldClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error && <p className="text-[14px] text-red">{error}</p>}

      <SubmitButton pending={pending}>Send reset code</SubmitButton>
    </form>
  );
}
