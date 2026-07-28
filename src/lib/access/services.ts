// Application services — the use-cases. They orchestrate repositories + infra
// ports + pure logic, and are the ONLY thing server actions call. Because they
// depend on interfaces (AccessContainer), the same service runs against the mock
// container today and the Supabase container later, unchanged.

import {
  GENERIC_REQUEST_RESPONSE,
  type AccessRequest,
  type AdminRole,
  type RequestPayload,
} from "./types";
import {
  allowlistStatusAfter,
  bulkApproveAllowed,
  canDecide,
  canDownloadResume,
  evaluateEmailForRequest,
  evaluateRateWindow,
  normalizeEmail,
  RATE_EMAIL,
  RATE_IP,
  requestDecisionAfter,
  sortRequestsForQueue,
  toE164,
  validateRequestPayload,
} from "./logic";
import type { AccessContainer, RequestFilter } from "./ports";
import type { RateWindow } from "./logic";

// ── Request Access (anti-enumeration) ───────────────────────────────────────
export class RequestAccessService {
  constructor(
    private c: AccessContainer,
    // Rate windows are injected so the store can be swapped (in-memory now,
    // Redis later) without touching this logic.
    private rate: {
      get(key: string): RateWindow | undefined;
      set(key: string, w: RateWindow): void;
    },
  ) {}

  // Step 1–3. ALWAYS returns the same generic message. Dispatches a magic link
  // only on a real, eligible match. Rate limited 5/IP/hr + 3/email/day.
  async requestAccess(email: string, ip: string): Promise<{ message: string; retryAfterSec?: number }> {
    const now = this.c.now();

    const ipKey = `ip:${ip}`;
    const ipR = evaluateRateWindow(this.rate.get(ipKey), RATE_IP.limit, RATE_IP.windowMs, now);
    this.rate.set(ipKey, ipR.window);
    if (!ipR.ok) return { message: GENERIC_REQUEST_RESPONSE, retryAfterSec: ipR.retryAfterSec };

    const emailKey = `email:${email.trim().toLowerCase()}`;
    const emR = evaluateRateWindow(this.rate.get(emailKey), RATE_EMAIL.limit, RATE_EMAIL.windowMs, now);
    this.rate.set(emailKey, emR.window);
    if (!emR.ok) return { message: GENERIC_REQUEST_RESPONSE, retryAfterSec: emR.retryAfterSec };

    // Reuse the pure eligibility rule with the (async) repo lookup.
    const entry = await this.c.allowlist.findByEmail(normalizeEmail(email));
    const { shouldDispatch } = evaluateEmailForRequest(email, () => entry);

    if (shouldDispatch && entry) {
      await this.c.auth.dispatchMagicLink(entry.email, entry.id);
      await this.c.audit.log({
        actorId: null, action: "access.request_link", targetType: "allowlist",
        targetId: entry.id, meta: { email: entry.email }, ip,
      });
    }
    // Identical response either way — the screen can never distinguish the cases.
    return { message: GENERIC_REQUEST_RESPONSE };
  }

  // Step 4–5. Persist the submitted profile + resume path; sets status→requested.
  async submitProfile(input: {
    email: string;
    payload: RequestPayload;
    resumePath: string | null;
    ip: string;
  }): Promise<{ ok: true; requestId: string } | { ok: false; missing: string[] }> {
    const missing = validateRequestPayload(input.payload);
    if (missing.length) return { ok: false, missing };

    const entry = await this.c.allowlist.findByEmail(input.email.trim().toLowerCase());
    const normalized: RequestPayload = {
      ...input.payload,
      phoneE164: toE164(input.payload.phoneE164) ?? input.payload.phoneE164,
      whatsappE164: toE164(input.payload.whatsappSameAsPhone ? input.payload.phoneE164 : input.payload.whatsappE164) ?? "",
    };
    const req = await this.c.requests.create({
      allowlistId: entry?.id ?? null,
      emailSubmitted: input.email,
      payload: normalized,
      resumePath: input.resumePath,
    });
    await this.c.audit.log({
      actorId: null, action: "access.submit_profile", targetType: "request",
      targetId: req.id, meta: { email: input.email }, ip: input.ip,
    });
    return { ok: true, requestId: req.id };
  }
}

// ── Admin review ────────────────────────────────────────────────────────────
export class AdminReviewService {
  constructor(private c: AccessContainer) {}

  async queue(filter?: RequestFilter): Promise<AccessRequest[]> {
    return sortRequestsForQueue(await this.c.requests.list(filter));
  }

  async decide(input: {
    requestId: string;
    action: "approve" | "reject";
    role: AdminRole;
    actorId: string;
    ip: string;
    rejectionReason?: string;
  }): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!canDecide(input.role)) return { ok: false, error: "Reviewers can recommend but not decide." };
    const req = await this.c.requests.getById(input.requestId);
    if (!req) return { ok: false, error: "Request not found." };

    await this.c.requests.recordDecision({
      id: req.id, decision: requestDecisionAfter(input.action),
      decidedBy: input.actorId, rejectionReason: input.rejectionReason ?? null,
    });

    if (req.allowlistId) {
      await this.c.allowlist.setStatus(req.allowlistId, allowlistStatusAfter(input.action));
      if (input.action === "approve") {
        // Provisioning genuinely needs live auth — the mock records intent.
        await this.c.auth.provisionAccount({ email: req.emailSubmitted, allowlistId: req.allowlistId });
      } else {
        await this.c.auth.sendRejectionEmail(req.emailSubmitted, input.rejectionReason ?? null);
      }
    }
    await this.c.audit.log({
      actorId: input.actorId, action: `access.${input.action}`, targetType: "request",
      targetId: req.id, meta: { reason: input.rejectionReason ?? null }, ip: input.ip,
    });
    return { ok: true };
  }

  async bulkDecide(input: {
    requestIds: string[];
    action: "approve" | "reject";
    typedCount: number;
    role: AdminRole;
    actorId: string;
    ip: string;
  }): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
    if (!canDecide(input.role)) return { ok: false, error: "Reviewers can recommend but not decide." };
    if (input.action === "approve" && !bulkApproveAllowed(input.typedCount, input.requestIds.length)) {
      return { ok: false, error: `Type the exact count (${input.requestIds.length}) to bulk approve.` };
    }
    for (const id of input.requestIds) {
      await this.decide({ requestId: id, action: input.action, role: input.role, actorId: input.actorId, ip: input.ip });
    }
    return { ok: true, count: input.requestIds.length };
  }

  async suspend(input: { allowlistId: string; role: AdminRole; actorId: string; ip: string }): Promise<{ ok: boolean; error?: string }> {
    if (!canDecide(input.role)) return { ok: false, error: "Reviewers can recommend but not decide." };
    await this.c.allowlist.setStatus(input.allowlistId, "suspended");
    await this.c.audit.log({ actorId: input.actorId, action: "access.suspend", targetType: "allowlist", targetId: input.allowlistId, meta: {}, ip: input.ip });
    return { ok: true };
  }

  // Resume download — allowed for both roles, ALWAYS audited (spec).
  async resumeDownloadUrl(input: { requestId: string; role: AdminRole; actorId: string; ip: string }): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
    if (!canDownloadResume(input.role)) return { ok: false, error: "Not permitted." };
    const req = await this.c.requests.getById(input.requestId);
    if (!req?.resumePath) return { ok: false, error: "No resume on file." };
    const url = await this.c.storage.signedResumeUrl(req.resumePath, 5 * 60);
    await this.c.audit.log({ actorId: input.actorId, action: "resume_download", targetType: "request", targetId: req.id, meta: {}, ip: input.ip });
    return { ok: true, url };
  }

  async addNote(input: { allowlistId: string; note: string; actorId: string; ip: string }): Promise<void> {
    await this.c.allowlist.update(input.allowlistId, { adminNotes: input.note });
    await this.c.audit.log({ actorId: input.actorId, action: "access.note", targetType: "allowlist", targetId: input.allowlistId, meta: { note: input.note }, ip: input.ip });
  }
}
