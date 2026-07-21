"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "../actions";
import SubmitButton from "../SubmitButton";
import { fieldClass, labelClass } from "../AuthShell";

export default function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    null,
  );

  return (
    <form action={action} className="space-y-5">
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
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-[12px] text-red">{state.fieldErrors.email}</p>
        )}
      </div>

      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}

      <SubmitButton pending={pending}>Send reset link</SubmitButton>
    </form>
  );
}
