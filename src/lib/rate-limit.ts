import { headers } from "next/headers";

// Best-effort in-memory rate limiter (Sprint 1, Module 8). Fixed-window counter
// keyed by an arbitrary string. This lives in the server process, so it is
// per-instance — good enough to blunt brute-force / spam from a single client on
// a single-instance deploy. For a multi-instance / serverless deploy, swap the
// Map for a shared store (Upstash/Redis) behind this same interface.

interface Bucket {
  count: number;
  resetAt: number; // epoch ms when the window rolls over
}

const store = new Map<string, Bucket>();

// Opportunistic prune so the Map can't grow unbounded from unique keys (e.g. one
// bucket per attacker IP). Runs only when the store is large and cheap-amortized.
function prune(now: number) {
  if (store.size < 5000) return;
  for (const [key, b] of store) {
    if (b.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec?: number;
}

// Allows `limit` events per `windowMs` for a given key. The first call in a
// window starts the clock; the (limit+1)th call within it is rejected.
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  prune(now);
  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true };
}

// Derives a stable rate-limit key from the caller's IP (proxy headers) plus a
// namespace so different actions get independent budgets. Falls back to
// "unknown" when no IP header is present (dev / same-host).
export async function ipKey(namespace: string): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : h.get("x-real-ip") ?? "").trim() || "unknown";
  return `${namespace}:${ip}`;
}
