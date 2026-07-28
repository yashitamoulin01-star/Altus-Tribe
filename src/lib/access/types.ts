// Domain types for the closed-membership access-control system.
// Pure data shapes — no framework or Supabase imports, so they're shared freely
// by logic, mock repositories, Supabase adapters, server actions, and UI.

export type TribeStatus =
  | "not_requested"
  | "requested"
  | "approved"
  | "rejected"
  | "suspended";

export type RequestDecision = "pending" | "approved" | "rejected";

export type ReviewStatus = "pending" | "resolved" | "dismissed";

export type AdminRole = "Admin" | "Reviewer";

export interface AllowlistEntry {
  id: string;
  fullName: string;
  email: string; // normalized (lowercased) — the primary key
  phoneE164: string | null;
  whatsappE164: string | null;
  company: string | null;
  designation: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  sourceAprContact: boolean;
  sourceJulRegistration: boolean;
  productivityShastraId: string | null; // PS cross-link (null until synced)
  status: TribeStatus;
  stale: boolean;
  adminNotes: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// The member-submitted profile that accompanies a request (spec step 4).
export interface RequestPayload {
  fullName: string;
  phoneE164: string;
  whatsappSameAsPhone: boolean;
  whatsappE164: string;
  company: string;
  designation: string;
  industry: string;
  city: string;
  state: string;
  country: string;
  linkedinUrl: string;
  bio: string;
  areasOfInterest: string;
  connectedToAltus: string; // "how they're connected to Altus"
  resumeFileName: string; // display only; the bytes go to private storage
}

export interface AccessRequest {
  id: string;
  allowlistId: string | null;
  emailSubmitted: string;
  payload: RequestPayload;
  resumePath: string | null; // private bucket key — never a public URL
  requestedAt: string; // ISO
  decision: RequestDecision;
  decidedAt: string | null;
  decidedBy: string | null;
  rejectionReason: string | null;
}

export interface ImportRun {
  id: string;
  source: string;
  importedBy: string | null;
  totalParsed: number;
  importedSuccessfully: number;
  sentToReview: number;
  mergeConflicts: number;
  validationWarnings: number;
  status: "dry_run" | "committed" | "rolled_back";
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
}

// The single generic message the Request Access screen ALWAYS returns, whether
// or not the email exists — this is what makes the form useless for enumerating
// the Conclave contact list.
export const GENERIC_REQUEST_RESPONSE =
  "If this email is on the Altus Conclave list, you'll receive a link within a few minutes.";

// Conclave source badge derived from the two source flags.
export type ConclaveBadge = "Apr" | "Jul" | "Both" | "—";
