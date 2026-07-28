// Pure business logic for access control. NO framework / Supabase / IO imports —
// every function here is deterministic and unit-tested (see logic.test.ts).
// This is the layer that must stay identical when the real infrastructure is
// wired in behind the repositories.

import type {
  AccessRequest,
  AdminRole,
  AllowlistEntry,
  ConclaveBadge,
  RequestPayload,
  TribeStatus,
} from "./types";

// ── normalization (shared with ingestion semantics) ─────────────────────────
const ZERO_WIDTH = /[​‌‍﻿]/g;

export function normalizeEmail(raw: string): string {
  return (raw || "").replace(ZERO_WIDTH, "").trim().toLowerCase();
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-z]{2,24}$/i;
export function isValidEmail(raw: string): boolean {
  return EMAIL_RE.test(normalizeEmail(raw));
}

// Phone → E.164, defaulting to +91 (India). Returns null when unusable.
export function toE164(raw: string, defaultCc = "91"): string | null {
  if (!raw) return null;
  const plus = raw.replace(ZERO_WIDTH, "").trim().startsWith("+");
  const digits = raw.replace(ZERO_WIDTH, "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+${defaultCc}${digits}`;
  if (digits.startsWith(defaultCc) && digits.length === 10 + defaultCc.length) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+${defaultCc}${digits.slice(1)}`;
  return plus ? `+${digits}` : `+${defaultCc}${digits}`;
}

// ── anti-enumeration ────────────────────────────────────────────────────────
// The screen shows the SAME text regardless; the ONLY observable difference is
// whether a link is actually dispatched. This helper reports the decision to the
// server (which acts on `shouldDispatch`) but the client only ever sees generic.
export interface EmailCheckOutcome {
  shouldDispatch: boolean; // true only on a real, eligible match
  matchedAllowlistId: string | null;
}

export function evaluateEmailForRequest(
  email: string,
  lookup: (normalized: string) => AllowlistEntry | null,
): EmailCheckOutcome {
  if (!isValidEmail(email)) return { shouldDispatch: false, matchedAllowlistId: null };
  const entry = lookup(normalizeEmail(email));
  const eligible = !!entry && !entry.stale && entry.status !== "suspended";
  return {
    shouldDispatch: eligible,
    matchedAllowlistId: eligible ? entry!.id : null,
  };
}

// ── rate limiting (pure, injectable clock) ──────────────────────────────────
// Fixed-window counter as a pure transform, so it's testable without a store.
export interface RateWindow {
  count: number;
  resetAt: number; // epoch ms
}
export interface RateOutcome {
  ok: boolean;
  window: RateWindow;
  retryAfterSec?: number;
}

export function evaluateRateWindow(
  prev: RateWindow | undefined,
  limit: number,
  windowMs: number,
  now: number,
): RateOutcome {
  if (!prev || prev.resetAt <= now) {
    return { ok: true, window: { count: 1, resetAt: now + windowMs } };
  }
  if (prev.count >= limit) {
    return { ok: false, window: prev, retryAfterSec: Math.ceil((prev.resetAt - now) / 1000) };
  }
  return { ok: true, window: { count: prev.count + 1, resetAt: prev.resetAt } };
}

// Spec limits: 5 attempts / IP / hour, 3 / email / day.
export const RATE_IP = { limit: 5, windowMs: 60 * 60 * 1000 };
export const RATE_EMAIL = { limit: 3, windowMs: 24 * 60 * 60 * 1000 };

// ── resume upload validation ────────────────────────────────────────────────
export const RESUME_MAX_BYTES = 10 * 1024 * 1024;
export const RESUME_EXTS = ["pdf", "doc", "docx"] as const;

export function validateResume(fileName: string, sizeBytes: number): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!RESUME_EXTS.includes(ext as (typeof RESUME_EXTS)[number])) {
    return "Please upload a PDF, DOC, or DOCX file.";
  }
  if (sizeBytes > RESUME_MAX_BYTES) return "Maximum file size is 10 MB.";
  return null;
}

// ── request-form validation ─────────────────────────────────────────────────
export function validateRequestPayload(p: RequestPayload): string[] {
  const missing: string[] = [];
  if (!p.fullName.trim()) missing.push("Full name");
  if (!toE164(p.phoneE164)) missing.push("Phone number");
  const wa = p.whatsappSameAsPhone ? p.phoneE164 : p.whatsappE164;
  if (!toE164(wa)) missing.push("WhatsApp number");
  if (!p.company.trim()) missing.push("Company");
  if (!p.city.trim()) missing.push("City");
  if (!p.connectedToAltus.trim()) missing.push("How you're connected to Altus");
  return missing;
}

// ── admin authorization ─────────────────────────────────────────────────────
// Reviewer may read + recommend but NOT approve/reject/suspend (spec). Resume
// downloads are allowed for both roles (always audited).
export function canDecide(role: AdminRole): boolean {
  return role === "Admin";
}
export function canDownloadResume(role: AdminRole): boolean {
  return role === "Admin" || role === "Reviewer";
}

// Bulk approve requires typing the affected count — guard the exact match.
export function bulkApproveAllowed(typedCount: number, actualCount: number): boolean {
  return actualCount > 0 && typedCount === actualCount;
}

// ── state transitions ───────────────────────────────────────────────────────
export function allowlistStatusAfter(action: "approve" | "reject" | "suspend"): TribeStatus {
  return action === "approve" ? "approved" : action === "reject" ? "rejected" : "suspended";
}
export function requestDecisionAfter(action: "approve" | "reject"): "approved" | "rejected" {
  return action === "approve" ? "approved" : "rejected";
}

// ── queue sort ──────────────────────────────────────────────────────────────
// Default admin sort surfaces work: `requested` (pending) first, then OLDEST
// request first. Everything else falls below, newest-first.
const DECISION_RANK: Record<AccessRequest["decision"], number> = {
  pending: 0,
  approved: 1,
  rejected: 1,
};
export function sortRequestsForQueue(rows: AccessRequest[]): AccessRequest[] {
  return [...rows].sort((a, b) => {
    const r = DECISION_RANK[a.decision] - DECISION_RANK[b.decision];
    if (r !== 0) return r;
    // pending → oldest first; others → newest first
    const at = Date.parse(a.requestedAt);
    const bt = Date.parse(b.requestedAt);
    return a.decision === "pending" ? at - bt : bt - at;
  });
}

// ── derived display helpers ─────────────────────────────────────────────────
export function conclaveBadge(e: Pick<AllowlistEntry, "sourceAprContact" | "sourceJulRegistration">): ConclaveBadge {
  if (e.sourceAprContact && e.sourceJulRegistration) return "Both";
  if (e.sourceAprContact) return "Apr";
  if (e.sourceJulRegistration) return "Jul";
  return "—";
}

// WhatsApp deep link for the Connect tab (e164 without the leading +).
export function whatsappLink(e164: string | null, prefill: string): string | null {
  if (!e164) return null;
  const num = e164.replace(/[^\d]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(prefill)}`;
}
