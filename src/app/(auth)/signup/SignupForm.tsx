"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs/legacy";
import SubmitButton from "../SubmitButton";
import { fieldClass, labelClass } from "../AuthShell";
import { passwordStrength } from "@/lib/validation/auth";
import LegalModal, { type LegalDocType } from "@/components/LegalModal";

function clerkMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const first = (err as { errors?: { message?: string; longMessage?: string }[] }).errors?.[0];
    return first?.longMessage || first?.message || "Couldn't create your account. Please try again.";
  }
  return "Couldn't create your account. Please try again.";
}

export default function SignupForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);
  const strength = passwordStrength(password);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || pending) return;
    setPending(true);
    setError(undefined);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: { full_name: fullName },
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
      setPending(false);
    } catch (err) {
      setError(clerkMessage(err));
      setPending(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || pending) return;
    setPending(true);
    setError(undefined);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.push("/onboarding");
        router.refresh();
        return;
      }
      setError("That code didn't verify. Please check and try again.");
      setPending(false);
    } catch (err) {
      setError(clerkMessage(err));
      setPending(false);
    }
  };

  // Verification step — shown after the account is created and a code is emailed.
  if (verifying) {
    return (
      <form onSubmit={onVerify} className="space-y-4">
        <p className="text-[14px] text-ink-secondary">
          We emailed a 6-digit code to <span className="font-medium text-ink">{email}</span>.
          Enter it below to confirm your account.
        </p>
        <div>
          <label htmlFor="code" className={labelClass}>
            Verification code
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
        {error && <p className="text-[14px] text-red">{error}</p>}
        <SubmitButton pending={pending}>Confirm & continue</SubmitButton>
      </form>
    );
  }

  return (
    <>
      <form onSubmit={onCreate} className="space-y-4">
        <div>
          <label htmlFor="full_name" className={labelClass}>
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            className={fieldClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
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
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
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
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-1 flex-1 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-full flex-1 rounded-full ${
                      i <= strength.score ? "bg-red" : "bg-hairline"
                    }`}
                  />
                ))}
              </div>
              <span className="w-12 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                {strength.label}
              </span>
            </div>
          )}
        </div>

        {/* Legal Checkboxes */}
        <div className="space-y-2 border-t border-hairline pt-3 text-[12px] text-ink-secondary">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              required
              name="agree_terms"
              className="mt-0.5 h-3.5 w-3.5 rounded border-hairline accent-[var(--color-red)] cursor-pointer"
            />
            <span>
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setLegalDoc("terms")}
                className="font-medium text-ink underline transition-colors hover:text-red"
              >
                Terms & Conditions
              </button>
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              required
              name="agree_privacy"
              className="mt-0.5 h-3.5 w-3.5 rounded border-hairline accent-[var(--color-red)] cursor-pointer"
            />
            <span>
              I have read the{" "}
              <button
                type="button"
                onClick={() => setLegalDoc("privacy")}
                className="font-medium text-ink underline transition-colors hover:text-red"
              >
                Privacy Policy
              </button>
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              required
              name="agree_guidelines"
              className="mt-0.5 h-3.5 w-3.5 rounded border-hairline accent-[var(--color-red)] cursor-pointer"
            />
            <span>
              I agree to follow the{" "}
              <button
                type="button"
                onClick={() => setLegalDoc("guidelines")}
                className="font-medium text-ink underline transition-colors hover:text-red"
              >
                Community Guidelines
              </button>
            </span>
          </label>
        </div>

        {/* Clerk Smart CAPTCHA mounts here only when a challenge is required. */}
        <div id="clerk-captcha" />

        {error && <p className="text-[14px] text-red">{error}</p>}

        <SubmitButton pending={pending}>Create account</SubmitButton>
      </form>
      <LegalModal type={legalDoc} onClose={() => setLegalDoc(null)} />
    </>
  );
}
