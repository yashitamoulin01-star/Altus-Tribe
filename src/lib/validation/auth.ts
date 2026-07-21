import { z } from "zod";

// Shared auth validation. Isomorphic (no server-only imports) so both the server
// actions and the client forms can use it. Server actions are the source of
// truth; the client uses the same rules for instant feedback + the strength meter.

export const emailSchema = z.email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer."); // bcrypt hard limit

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: emailSchema,
  password: passwordSchema,
});

export const emailOnlySchema = z.object({ email: emailSchema });

export const newPasswordSchema = z.object({ password: passwordSchema });

export type FieldErrors = Record<string, string>;

// Flattens a ZodError into a { field: firstMessage } map for the UI.
export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0 = empty, 4 = strong
  label: string;
}

// Lightweight heuristic strength meter (client-side hint, not a gate).
export function passwordStrength(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: "" };
  let points = 0;
  if (pw.length >= 8) points++;
  if (pw.length >= 12) points++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) points++;
  if (/\d/.test(pw)) points++;
  if (/[^A-Za-z0-9]/.test(pw)) points++;
  const score = Math.min(4, points) as PasswordStrength["score"];
  const label = ["", "Weak", "Fair", "Good", "Strong"][score];
  return { score, label };
}
