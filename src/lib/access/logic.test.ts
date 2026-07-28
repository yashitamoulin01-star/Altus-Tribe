// Unit tests for the pure access-control business logic.
// Run: node --test src/lib/access/logic.test.ts   (Node 24 strips types natively;
// no external test runner or services required).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allowlistStatusAfter,
  bulkApproveAllowed,
  canDecide,
  canDownloadResume,
  conclaveBadge,
  evaluateEmailForRequest,
  evaluateRateWindow,
  isValidEmail,
  normalizeEmail,
  RATE_EMAIL,
  RATE_IP,
  requestDecisionAfter,
  sortRequestsForQueue,
  toE164,
  validateRequestPayload,
  validateResume,
  whatsappLink,
} from "./logic.ts";
import type { AccessRequest, AllowlistEntry, RequestPayload } from "./types.ts";

const entry = (over: Partial<AllowlistEntry> = {}): AllowlistEntry => ({
  id: "a1", fullName: "Test User", email: "t@x.com", phoneE164: "+919820000000",
  whatsappE164: "+919820000000", company: null, designation: null, city: null,
  state: null, country: null, sourceAprContact: false, sourceJulRegistration: false,
  productivityShastraId: null, status: "not_requested", stale: false,
  adminNotes: null, createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-01T00:00:00Z",
  ...over,
});

// ── normalization ──
test("normalizeEmail lowercases, trims, strips zero-width", () => {
  assert.equal(normalizeEmail("  Foo@Bar.COM ​"), "foo@bar.com");
});

test("isValidEmail rejects digit/garbage TLDs", () => {
  assert.equal(isValidEmail("a@b.com"), true);
  assert.equal(isValidEmail("sunil@steelcarriers.in8"), false);
  assert.equal(isValidEmail("no-at"), false);
});

test("toE164 defaults to +91 and normalizes formats", () => {
  assert.equal(toE164("9820000000"), "+919820000000");
  assert.equal(toE164("+91 98200 00000"), "+919820000000");
  assert.equal(toE164("09820000000"), "+919820000000");
  assert.equal(toE164(""), null);
});

// ── anti-enumeration ──
test("evaluateEmailForRequest dispatches ONLY on eligible match", () => {
  const list = [entry({ id: "hit", email: "hit@x.com" })];
  const lookup = (e: string) => list.find((r) => r.email === e) ?? null;

  assert.deepEqual(evaluateEmailForRequest("HIT@x.com", lookup), { shouldDispatch: true, matchedAllowlistId: "hit" });
  assert.deepEqual(evaluateEmailForRequest("miss@x.com", lookup), { shouldDispatch: false, matchedAllowlistId: null });
  assert.equal(evaluateEmailForRequest("garbage", lookup).shouldDispatch, false);
});

test("suspended / stale entries do not dispatch", () => {
  const lookup = () => entry({ id: "s", email: "s@x.com", status: "suspended" });
  assert.equal(evaluateEmailForRequest("s@x.com", lookup).shouldDispatch, false);
  const lookup2 = () => entry({ id: "s", email: "s@x.com", stale: true });
  assert.equal(evaluateEmailForRequest("s@x.com", lookup2).shouldDispatch, false);
});

// ── rate limiting ──
test("evaluateRateWindow enforces the fixed window", () => {
  const now = 1_000_000;
  let w = evaluateRateWindow(undefined, 3, 1000, now);
  assert.equal(w.ok, true);
  w = evaluateRateWindow(w.window, 3, 1000, now);
  assert.equal(w.ok, true);
  w = evaluateRateWindow(w.window, 3, 1000, now);
  assert.equal(w.ok, true); // 3rd allowed
  const blocked = evaluateRateWindow(w.window, 3, 1000, now);
  assert.equal(blocked.ok, false);
  assert.ok((blocked.retryAfterSec ?? 0) > 0);
  // window rolls over
  const after = evaluateRateWindow(w.window, 3, 1000, now + 1001);
  assert.equal(after.ok, true);
});

test("spec limits: 5/IP/hr and 3/email/day", () => {
  assert.equal(RATE_IP.limit, 5);
  assert.equal(RATE_IP.windowMs, 3_600_000);
  assert.equal(RATE_EMAIL.limit, 3);
  assert.equal(RATE_EMAIL.windowMs, 86_400_000);
});

// ── resume validation ──
test("validateResume checks ext + size", () => {
  assert.equal(validateResume("cv.pdf", 1000), null);
  assert.equal(validateResume("cv.docx", 1000), null);
  assert.match(validateResume("cv.png", 1000)!, /PDF, DOC, or DOCX/);
  assert.match(validateResume("cv.pdf", 11 * 1024 * 1024)!, /10 MB/);
});

// ── request payload validation ──
test("validateRequestPayload lists missing required fields", () => {
  const base: RequestPayload = {
    fullName: "", phoneE164: "", whatsappSameAsPhone: true, whatsappE164: "",
    company: "", designation: "", industry: "", city: "", state: "", country: "",
    linkedinUrl: "", bio: "", areasOfInterest: "", connectedToAltus: "", resumeFileName: "",
  };
  const miss = validateRequestPayload(base);
  assert.ok(miss.includes("Full name"));
  assert.ok(miss.includes("Phone number"));
  assert.ok(miss.includes("Company"));
  assert.ok(miss.includes("City"));
  assert.ok(miss.includes("How you're connected to Altus"));

  const ok: RequestPayload = { ...base, fullName: "A B", phoneE164: "9820000000", whatsappSameAsPhone: true, company: "Acme", city: "Mumbai", connectedToAltus: "Conclave April" };
  assert.deepEqual(validateRequestPayload(ok), []);
});

// ── authorization ──
test("Reviewer cannot decide but can download; Admin can both", () => {
  assert.equal(canDecide("Admin"), true);
  assert.equal(canDecide("Reviewer"), false);
  assert.equal(canDownloadResume("Reviewer"), true);
  assert.equal(canDownloadResume("Admin"), true);
});

test("bulkApproveAllowed requires an exact, non-zero count match", () => {
  assert.equal(bulkApproveAllowed(3, 3), true);
  assert.equal(bulkApproveAllowed(2, 3), false);
  assert.equal(bulkApproveAllowed(0, 0), false);
});

// ── transitions ──
test("status + decision transitions", () => {
  assert.equal(allowlistStatusAfter("approve"), "approved");
  assert.equal(allowlistStatusAfter("reject"), "rejected");
  assert.equal(allowlistStatusAfter("suspend"), "suspended");
  assert.equal(requestDecisionAfter("approve"), "approved");
  assert.equal(requestDecisionAfter("reject"), "rejected");
});

// ── queue sort ──
test("sortRequestsForQueue: pending oldest-first, then the rest", () => {
  const r = (id: string, decision: AccessRequest["decision"], requestedAt: string): AccessRequest => ({
    id, allowlistId: null, emailSubmitted: `${id}@x.com`, payload: {} as RequestPayload,
    resumePath: null, requestedAt, decision, decidedAt: null, decidedBy: null, rejectionReason: null,
  });
  const rows = [
    r("approved_new", "approved", "2026-07-10T00:00:00Z"),
    r("pending_new", "pending", "2026-07-05T00:00:00Z"),
    r("pending_old", "pending", "2026-07-01T00:00:00Z"),
  ];
  const sorted = sortRequestsForQueue(rows).map((x) => x.id);
  assert.deepEqual(sorted, ["pending_old", "pending_new", "approved_new"]);
});

// ── derived helpers ──
test("conclaveBadge maps source flags", () => {
  assert.equal(conclaveBadge({ sourceAprContact: true, sourceJulRegistration: true }), "Both");
  assert.equal(conclaveBadge({ sourceAprContact: true, sourceJulRegistration: false }), "Apr");
  assert.equal(conclaveBadge({ sourceAprContact: false, sourceJulRegistration: true }), "Jul");
  assert.equal(conclaveBadge({ sourceAprContact: false, sourceJulRegistration: false }), "—");
});

test("whatsappLink strips + and encodes prefill", () => {
  assert.equal(whatsappLink("+919820000000", "Hi there"), "https://wa.me/919820000000?text=Hi%20there");
  assert.equal(whatsappLink(null, "x"), null);
});
