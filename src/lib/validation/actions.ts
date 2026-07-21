import { z } from "zod";
import { logError } from "@/lib/logger";

// Server-action validation + safe error mapping (Sprint 1, Modules 7 & 8).
// Extends the auth-only zod layer to the rest of the mutations. Two jobs:
//   1. Validate untrusted args (UUIDs, lengths, formats) before they hit the DB.
//   2. Never leak raw Postgres/PostgREST error text to the client — log it
//      server-side (lib/logger) and hand back a short, safe message instead.

export const uuidSchema = z.uuid("Invalid id.");

// Field-level rules mirrored from the P3 client validations, now enforced
// server-side too (defense in depth — the client can be bypassed).
export const optionalEmail = z
  .email("Enter a valid email address.")
  .or(z.literal(""))
  .optional();

export const optionalUrl = z
  .url("Enter a valid URL.")
  .or(z.literal(""))
  .optional();

// Free-text caps so a hostile client can't push megabytes into a column.
export const shortText = z.string().max(300);
export const longText = z.string().max(5000);

export const messageBodySchema = z.string().trim().min(1, "empty").max(4000, "too long");

// Maps a caught/returned DB error to a safe client message and logs the real
// one. `action` is the server-action name for log correlation; `fallback` is
// what the user sees. Returns the SaveResult-shaped failure so callers can
// `return failFrom(...)` directly.
export function failFrom(
  action: string,
  err: unknown,
  fallback = "Something went wrong. Please try again.",
  ctx?: { userId?: string },
): { ok: false; error: string } {
  logError(action, err, ctx);
  return { ok: false, error: fallback };
}

// Validates an id argument; returns null when valid, or a safe failure when not.
export function badId(id: string): { ok: false; error: string } | null {
  const parsed = uuidSchema.safeParse(id);
  return parsed.success ? null : { ok: false, error: "Invalid request." };
}
