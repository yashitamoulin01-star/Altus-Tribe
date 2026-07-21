// Structured logging for server actions / API / DB failures (Sprint 1, Module 6).
// Server-only by convention — only imported from "use server" action modules.
// Emits one JSON line per event so logs are greppable and machine-parseable in
// any host (Vercel, container, etc). Never send these strings to the client —
// use `failFrom` in lib/validation/actions.ts for the safe user-facing message.

type Level = "info" | "warn" | "error";

export interface LogContext {
  // The server action / route that produced the event, e.g. "saveProfile".
  action?: string;
  // Acting user, when known. Helps correlate without exposing PII in the message.
  userId?: string | null;
  // Postgres / PostgREST error code (e.g. "23505", "PGRST116"), when present.
  code?: string;
  [key: string]: unknown;
}

function emit(level: Level, message: string, ctx?: LogContext) {
  const line = JSON.stringify({
    level,
    message,
    ts: new Date().toISOString(),
    ...ctx,
  });
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}

// Extracts a Postgres/PostgREST code + message from an unknown thrown/returned
// error so callers can `logError("action", err, { userId })` uniformly.
function describe(err: unknown): { message: string; code?: string } {
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; code?: unknown };
    return {
      message: typeof e.message === "string" ? e.message : String(err),
      code: typeof e.code === "string" ? e.code : undefined,
    };
  }
  return { message: String(err) };
}

export const logger = {
  info: (message: string, ctx?: LogContext) => emit("info", message, ctx),
  warn: (message: string, ctx?: LogContext) => emit("warn", message, ctx),
  error: (message: string, ctx?: LogContext) => emit("error", message, ctx),
};

// Convenience for the common "DB call returned an error" shape. Logs the real
// details server-side and returns the parsed code so callers can branch.
export function logError(
  action: string,
  err: unknown,
  ctx?: Omit<LogContext, "action" | "code">,
): { code?: string } {
  const { message, code } = describe(err);
  emit("error", message, { action, code, ...ctx });
  return { code };
}
