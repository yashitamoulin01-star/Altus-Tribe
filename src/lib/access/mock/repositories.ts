// In-memory implementations of the repository/infra ports. Deterministic,
// no external services — powers the UI and (indirectly) integration checks
// during Option-1 development. Module-level singletons so state persists across
// server-action calls within a single dev process.

import {
  conclaveBadge,
  normalizeEmail,
  whatsappLink,
} from "../logic";
import type {
  AccessRequestRepo,
  AllowlistRepo,
  AuditRepo,
  AuthPort,
  ImportRunRepo,
  RequestFilter,
  StoragePort,
  AllowlistFilter,
} from "../ports";
import type { AccessRequest, AllowlistEntry, AuditEntry, ImportRun } from "../types";
import { seedAllowlist, seedImportRuns, seedRequests } from "./fixtures";

// Clone seeds so tests / hot-reload don't mutate the source arrays.
const allowlist: AllowlistEntry[] = seedAllowlist.map((e) => ({ ...e }));
const requests: AccessRequest[] = seedRequests.map((r) => ({ ...r }));
const importRuns: ImportRun[] = seedImportRuns.map((r) => ({ ...r }));
const audit: AuditEntry[] = [];

let seq = 1000;
const id = (p: string) => `${p}-${++seq}`;
const nowIso = () => new Date().toISOString();

function matchesSource(e: AllowlistEntry, source?: "apr" | "jul" | "both") {
  if (!source) return true;
  if (source === "both") return e.sourceAprContact && e.sourceJulRegistration;
  return source === "apr" ? e.sourceAprContact : e.sourceJulRegistration;
}

export const mockAllowlistRepo: AllowlistRepo = {
  async findByEmail(email) {
    const n = normalizeEmail(email);
    return allowlist.find((e) => e.email === n) ?? null;
  },
  async getById(idv) {
    return allowlist.find((e) => e.id === idv) ?? null;
  },
  async list(filter: AllowlistFilter = {}) {
    const q = filter.search?.toLowerCase().trim();
    return allowlist.filter((e) => {
      if (filter.status && e.status !== filter.status) return false;
      if (!matchesSource(e, filter.source)) return false;
      if (filter.psLinked !== undefined && !!e.productivityShastraId !== filter.psLinked) return false;
      if (filter.state && e.state !== filter.state) return false;
      if (filter.city && e.city !== filter.city) return false;
      if (q) {
        const hay = [e.fullName, e.email, e.phoneE164, e.company].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  },
  async setStatus(idv, status) {
    const e = allowlist.find((x) => x.id === idv);
    if (e) { e.status = status; e.updatedAt = nowIso(); }
  },
  async update(idv, patch) {
    const e = allowlist.find((x) => x.id === idv);
    if (e) Object.assign(e, patch, { updatedAt: nowIso() });
  },
};

export const mockRequestRepo: AccessRequestRepo = {
  async create({ allowlistId, emailSubmitted, payload, resumePath }) {
    const row: AccessRequest = {
      id: id("req"), allowlistId, emailSubmitted: normalizeEmail(emailSubmitted),
      payload, resumePath, requestedAt: nowIso(), decision: "pending",
      decidedAt: null, decidedBy: null, rejectionReason: null,
    };
    requests.push(row);
    if (allowlistId) {
      const e = allowlist.find((x) => x.id === allowlistId);
      if (e && e.status === "not_requested") { e.status = "requested"; e.updatedAt = nowIso(); }
    }
    return row;
  },
  async getById(idv) {
    return requests.find((r) => r.id === idv) ?? null;
  },
  async list(filter: RequestFilter = {}) {
    const q = filter.search?.toLowerCase().trim();
    const byId = new Map(allowlist.map((e) => [e.id, e]));
    return requests.filter((r) => {
      if (filter.decision && r.decision !== filter.decision) return false;
      const e = r.allowlistId ? byId.get(r.allowlistId) : undefined;
      if (filter.source && !(e && matchesSource(e, filter.source))) return false;
      if (filter.psLinked !== undefined && !!(e?.productivityShastraId) !== filter.psLinked) return false;
      if (filter.state && e?.state !== filter.state) return false;
      if (filter.city && e?.city !== filter.city) return false;
      if (filter.fromDate && Date.parse(r.requestedAt) < Date.parse(filter.fromDate)) return false;
      if (filter.toDate && Date.parse(r.requestedAt) > Date.parse(filter.toDate)) return false;
      if (q) {
        const hay = [r.payload.fullName, r.emailSubmitted, r.payload.phoneE164, r.payload.company].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  },
  async recordDecision({ id: idv, decision, decidedBy, rejectionReason }) {
    const r = requests.find((x) => x.id === idv);
    if (r) {
      r.decision = decision;
      r.decidedAt = nowIso();
      r.decidedBy = decidedBy;
      r.rejectionReason = rejectionReason ?? null;
    }
  },
};

export const mockImportRepo: ImportRunRepo = {
  async list() { return [...importRuns]; },
  async record(run) {
    const row: ImportRun = { ...run, id: id("imp"), createdAt: nowIso() };
    importRuns.push(row);
    return row;
  },
};

export const mockAuditRepo: AuditRepo = {
  async log(entry) {
    audit.push({ ...entry, id: id("aud"), createdAt: nowIso() });
  },
  async list(filter = {}) {
    return audit.filter((a) =>
      (!filter.targetType || a.targetType === filter.targetType) &&
      (!filter.targetId || a.targetId === filter.targetId));
  },
};

// Infra ports — mock records the intent so the flow is fully exercisable; the
// real side effects arrive with the Supabase adapters.
export const mockAuthPort: AuthPort = {
  async dispatchMagicLink(email, allowlistId) {
    audit.push({ id: id("aud"), actorId: null, action: "magic_link.dispatch",
      targetType: "allowlist", targetId: allowlistId, meta: { email, mock: true }, ip: null, createdAt: nowIso() });
  },
  async provisionAccount({ email, allowlistId }) {
    return { userId: `mock-user-${allowlistId}-${normalizeEmail(email)}` };
  },
  async sendRejectionEmail(email, reason) {
    audit.push({ id: id("aud"), actorId: null, action: "email.rejection",
      targetType: "email", targetId: null, meta: { email, reason, mock: true }, ip: null, createdAt: nowIso() });
  },
};

export const mockStoragePort: StoragePort = {
  async putResume({ requestEmail, fileName }) {
    return { path: `resumes/${normalizeEmail(requestEmail)}/${fileName}` };
  },
  async signedResumeUrl(path) {
    // A mock, obviously-non-public placeholder; never a real signed URL.
    return `mock-signed:${path}`;
  },
};

// Small helpers re-exported for the UI to render derived values consistently.
export const mockDerive = { conclaveBadge, whatsappLink };
