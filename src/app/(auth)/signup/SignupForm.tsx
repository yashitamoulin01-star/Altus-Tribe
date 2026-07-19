"use client";

import { useActionState } from "react";
import { signup, type AuthState } from "../actions";
import SubmitButton from "../SubmitButton";
import { fieldClass, labelClass } from "../AuthShell";

export default function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signup,
    null,
  );

  return (
    <form action={action} className="space-y-5">
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
        />
      </div>

      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}

      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  );
}
