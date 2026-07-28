// ═══════════════════════════════════════════════════════════════════════════
// Supabase adapters — the ISOLATED infrastructure edge. Nothing outside this
// file imports Supabase for access control. Each method's query shape is written
// out (so wiring is mechanical), but they THROW until the prerequisites from
// docs/17-infrastructure-readiness-checklist.md are in place. The container
// (container.ts) only selects these when USE_SUPABASE_ACCESS is enabled AND the
// service-role client is available.
//
// To go live: implement the bodies against a service-role Supabase client and
// flip the container flag. The service/logic layers do not change.
// ═══════════════════════════════════════════════════════════════════════════

import type {
  AccessRequestRepo,
  AllowlistRepo,
  AuditRepo,
  AuthPort,
  ImportRunRepo,
  StoragePort,
} from "../ports";

const NOT_WIRED = (what: string) =>
  new Error(
    `[access/supabase] ${what} needs live infrastructure. See ` +
      `docs/17-infrastructure-readiness-checklist.md (service-role key / bucket / PS DB).`,
  );

// A minimal shape for whatever service-role client we inject later.
export interface ServiceRoleDb {
  // e.g. from("tribe_allowlist").select()... — kept opaque here on purpose.
  from(table: string): unknown;
}

export function makeSupabaseAllowlistRepo(): AllowlistRepo {
  return {
    // select * from tribe_allowlist where email = $1 (citext) limit 1
    async findByEmail() { throw NOT_WIRED("allowlist.findByEmail"); },
    async getById() { throw NOT_WIRED("allowlist.getById"); },
    async list() { throw NOT_WIRED("allowlist.list"); },
    async setStatus() { throw NOT_WIRED("allowlist.setStatus"); },
    async update() { throw NOT_WIRED("allowlist.update"); },
  };
}

export function makeSupabaseRequestRepo(): AccessRequestRepo {
  return {
    async create() { throw NOT_WIRED("requests.create"); },
    async getById() { throw NOT_WIRED("requests.getById"); },
    async list() { throw NOT_WIRED("requests.list"); },
    async recordDecision() { throw NOT_WIRED("requests.recordDecision"); },
  };
}

export function makeSupabaseImportRepo(): ImportRunRepo {
  return {
    async list() { throw NOT_WIRED("imports.list"); },
    async record() { throw NOT_WIRED("imports.record"); },
  };
}

export function makeSupabaseAuditRepo(): AuditRepo {
  return {
    // insert into audit_logs (actor_id, action, entity_type, entity_id, metadata, ip)
    async log() { throw NOT_WIRED("audit.log"); },
    async list() { throw NOT_WIRED("audit.list"); },
  };
}

// Genuinely deferred infra (checklist D/C/E).
export function makeSupabaseAuthPort(): AuthPort {
  return {
    // supabase.auth.admin.generateLink({ type: "magiclink", email }) + email send
    async dispatchMagicLink() { throw NOT_WIRED("auth.dispatchMagicLink"); },
    // supabase.auth.admin.createUser(...) + insert tribe_users + set-password email
    async provisionAccount() { throw NOT_WIRED("auth.provisionAccount"); },
    async sendRejectionEmail() { throw NOT_WIRED("auth.sendRejectionEmail"); },
  };
}

export function makeSupabaseStoragePort(): StoragePort {
  return {
    // storage.from("resumes").upload(path, bytes) — private bucket, 10 MB cap
    async putResume() { throw NOT_WIRED("storage.putResume"); },
    // storage.from("resumes").createSignedUrl(path, 300) — 5-min expiry, audited
    async signedResumeUrl() { throw NOT_WIRED("storage.signedResumeUrl"); },
  };
}
