"use client";

import { useActionState } from "react";
import { resendConfirmation, type AuthState } from "./actions";
import { fieldClass } from "./AuthShell";

// Shown on /login?check_email=1 after signup: confirms an email was sent and
// lets the member resend it if it didn't arrive. Email is prefilled from the
// signup redirect; if absent, the member types it.
export default function ResendConfirmation({ email }: { email?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    resendConfirmation,
    null,
  );

  return (
    <div
      style={{
        marginBottom: "20px",
        padding: "12px 16px",
        border: "1px solid #e4e4e2",
        borderRadius: "2px",
        background: "#f4f4f3",
      }}
    >
      <p style={{ fontSize: "13px", color: "#5f5f5f" }}>
        Check your email to confirm your account, then sign in.
      </p>

      {state?.sent ? (
        <p style={{ marginTop: "8px", fontSize: "13px", color: "#111111" }}>
          Sent — check your inbox (and spam).
        </p>
      ) : (
        <form action={action} style={{ marginTop: "10px" }}>
          {!email && (
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              className={fieldClass}
              style={{ marginBottom: "8px" }}
            />
          )}
          {email && <input type="hidden" name="email" value={email} />}
          <button
            type="submit"
            disabled={pending}
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#b3122b",
              background: "none",
              border: "none",
              padding: 0,
              cursor: pending ? "default" : "pointer",
              opacity: pending ? 0.5 : 1,
            }}
          >
            {pending ? "Sending…" : "Didn't get it? Resend confirmation"}
          </button>
          {(state?.error || state?.fieldErrors?.email) && (
            <p style={{ marginTop: "6px", fontSize: "12px", color: "#c8102e" }}>
              {state.error ?? state.fieldErrors?.email}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
