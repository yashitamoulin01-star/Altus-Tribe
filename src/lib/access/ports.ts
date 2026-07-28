// Repository & infrastructure PORT interfaces. Services depend only on these;
// concrete implementations are the mock repositories (today) or the Supabase
// adapters (once credentials exist). Swapping is a one-line container change.

import type {
  AccessRequest,
  AllowlistEntry,
  AuditEntry,
  ImportRun,
  RequestPayload,
} from "./types";

export interface AllowlistRepo {
  findByEmail(normalizedEmail: string): Promise<AllowlistEntry | null>;
  getById(id: string): Promise<AllowlistEntry | null>;
  list(filter?: AllowlistFilter): Promise<AllowlistEntry[]>;
  setStatus(id: string, status: AllowlistEntry["status"]): Promise<void>;
  update(id: string, patch: Partial<AllowlistEntry>): Promise<void>;
}

export interface AllowlistFilter {
  status?: AllowlistEntry["status"];
  source?: "apr" | "jul" | "both";
  psLinked?: boolean;
  state?: string;
  city?: string;
  search?: string; // name / email / phone / company
}

export interface AccessRequestRepo {
  create(input: {
    allowlistId: string | null;
    emailSubmitted: string;
    payload: RequestPayload;
    resumePath: string | null;
  }): Promise<AccessRequest>;
  getById(id: string): Promise<AccessRequest | null>;
  list(filter?: RequestFilter): Promise<AccessRequest[]>;
  recordDecision(input: {
    id: string;
    decision: "approved" | "rejected";
    decidedBy: string;
    rejectionReason?: string | null;
  }): Promise<void>;
}

export interface RequestFilter {
  decision?: AccessRequest["decision"];
  source?: "apr" | "jul" | "both";
  psLinked?: boolean;
  state?: string;
  city?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface ImportRunRepo {
  list(): Promise<ImportRun[]>;
  record(run: Omit<ImportRun, "id" | "createdAt">): Promise<ImportRun>;
}

export interface AuditRepo {
  log(entry: Omit<AuditEntry, "id" | "createdAt">): Promise<void>;
  list(filter?: { targetType?: string; targetId?: string }): Promise<AuditEntry[]>;
}

// ── infra ports (genuinely deferred; adapters throw until wired) ─────────────

// Magic-link dispatch. The mock records the intent; the Supabase adapter calls
// auth.admin.generateLink + the email sender.
export interface AuthPort {
  dispatchMagicLink(email: string, allowlistId: string): Promise<void>;
  provisionAccount(input: { email: string; allowlistId: string }): Promise<{ userId: string }>;
  sendRejectionEmail(email: string, reason: string | null): Promise<void>;
}

// Private resume storage. The mock stores metadata; the Supabase adapter uploads
// to the private bucket and mints short-lived signed URLs.
export interface StoragePort {
  putResume(input: { requestEmail: string; fileName: string; bytes: Uint8Array }): Promise<{ path: string }>;
  signedResumeUrl(path: string, ttlSeconds: number): Promise<string>;
}

// Everything a service needs, in one bag.
export interface AccessContainer {
  allowlist: AllowlistRepo;
  requests: AccessRequestRepo;
  imports: ImportRunRepo;
  audit: AuditRepo;
  auth: AuthPort;
  storage: StoragePort;
  now: () => number; // injectable clock (tests / determinism)
}
