"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "../actions";
import SubmitButton from "../SubmitButton";
import { fieldClass, labelClass } from "../AuthShell";

export default function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    null,
  );

  return (
    <form action={action} className="space-y-5">
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
        />
      </div>

      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}

      <SubmitButton pending={pending}>Update password</SubmitButton>
    </form>
  );
}
