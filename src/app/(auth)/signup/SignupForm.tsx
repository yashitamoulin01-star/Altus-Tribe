"use client";

import { useActionState, useState } from "react";
import { signup, type AuthState } from "../actions";
import SubmitButton from "../SubmitButton";
import { fieldClass, labelClass } from "../AuthShell";
import { passwordStrength } from "@/lib/validation/auth";
import CaptchaField from "@/components/CaptchaField";
import LegalModal, { type LegalDocType } from "@/components/LegalModal";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[12px] text-red">{message}</p>;
}

export default function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signup,
    null,
  );
  const [password, setPassword] = useState("");
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);
  const strength = passwordStrength(password);

  return (
    <>
      <form action={action} className="space-y-4">
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
          />
          <FieldError message={state?.fieldErrors?.fullName} />
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
          />
          <FieldError message={state?.fieldErrors?.email} />
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
          <FieldError message={state?.fieldErrors?.password} />
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

        <CaptchaField />

        {state?.error && <p className="text-[14px] text-red">{state.error}</p>}

        <SubmitButton pending={pending}>Create account</SubmitButton>
      </form>
      <LegalModal type={legalDoc} onClose={() => setLegalDoc(null)} />
    </>
  );
}
