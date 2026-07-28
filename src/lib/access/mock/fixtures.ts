// Realistic in-memory seed data for the mock repositories. Fictional people —
// NOT the real Conclave PII (that lives only in the gitignored ingestion output
// and the eventual private seed). Enough variety to exercise every UI state.

import type { AccessRequest, AllowlistEntry, ImportRun } from "../types";

export const seedAllowlist: AllowlistEntry[] = [
  {
    id: "al-001", fullName: "Aarav Mehta", email: "aarav@brightpack.in",
    phoneE164: "+919820011001", whatsappE164: "+919820011001",
    company: "BrightPack Solutions", designation: "Founder", city: "Mumbai",
    state: "Maharashtra", country: "India", sourceAprContact: true,
    sourceJulRegistration: true, productivityShastraId: "ps-5521",
    status: "requested", stale: false, adminNotes: null,
    createdAt: "2026-04-02T09:00:00Z", updatedAt: "2026-07-26T10:00:00Z",
  },
  {
    id: "al-002", fullName: "Isha Rao", email: "isha@rao-legal.com",
    phoneE164: "+919820011002", whatsappE164: "+919820011002",
    company: "Rao Legal LLP", designation: "Managing Partner", city: "Pune",
    state: "Maharashtra", country: "India", sourceAprContact: false,
    sourceJulRegistration: true, productivityShastraId: null,
    status: "requested", stale: false, adminNotes: null,
    createdAt: "2026-07-05T09:00:00Z", updatedAt: "2026-07-27T08:00:00Z",
  },
  {
    id: "al-003", fullName: "Kabir Shah", email: "kabir@shahsteel.co",
    phoneE164: "+919820011003", whatsappE164: "+919820011003",
    company: "Shah Steel Traders", designation: "Director", city: "Ahmedabad",
    state: "Gujarat", country: "India", sourceAprContact: true,
    sourceJulRegistration: false, productivityShastraId: "ps-4410",
    status: "approved", stale: false, adminNotes: "Verified at April conclave.",
    createdAt: "2026-04-02T09:00:00Z", updatedAt: "2026-07-20T12:00:00Z",
  },
  {
    id: "al-004", fullName: "Nisha Verma", email: "nisha@vermadesign.studio",
    phoneE164: "+919820011004", whatsappE164: "+919820011004",
    company: "Verma Design Studio", designation: "Principal Designer",
    city: "Bengaluru", state: "Karnataka", country: "India",
    sourceAprContact: false, sourceJulRegistration: true,
    productivityShastraId: null, status: "not_requested", stale: false,
    adminNotes: null, createdAt: "2026-07-05T09:00:00Z", updatedAt: "2026-07-05T09:00:00Z",
  },
  {
    id: "al-005", fullName: "Rohan Kulkarni", email: "rohan@kulkarnicap.com",
    phoneE164: "+919820011005", whatsappE164: "+919820011005",
    company: "Kulkarni Capital", designation: "Analyst", city: "Mumbai",
    state: "Maharashtra", country: "India", sourceAprContact: true,
    sourceJulRegistration: false, productivityShastraId: "ps-3300",
    status: "suspended", stale: false, adminNotes: "Suspended pending review.",
    createdAt: "2026-04-02T09:00:00Z", updatedAt: "2026-07-22T15:00:00Z",
  },
];

export const seedRequests: AccessRequest[] = [
  {
    id: "req-001", allowlistId: "al-001", emailSubmitted: "aarav@brightpack.in",
    payload: {
      fullName: "Aarav Mehta", phoneE164: "+919820011001", whatsappSameAsPhone: true,
      whatsappE164: "+919820011001", company: "BrightPack Solutions", designation: "Founder",
      industry: "Manufacturing", city: "Mumbai", state: "Maharashtra", country: "India",
      linkedinUrl: "linkedin.com/in/aaravmehta", bio: "Sustainable packaging for D2C brands.",
      areasOfInterest: "Exports, B2B partnerships", connectedToAltus: "Attended April 2026 Conclave",
      resumeFileName: "aarav-mehta-cv.pdf",
    },
    resumePath: "resumes/al-001/aarav-mehta-cv.pdf", requestedAt: "2026-07-26T10:00:00Z",
    decision: "pending", decidedAt: null, decidedBy: null, rejectionReason: null,
  },
  {
    id: "req-002", allowlistId: "al-002", emailSubmitted: "isha@rao-legal.com",
    payload: {
      fullName: "Isha Rao", phoneE164: "+919820011002", whatsappSameAsPhone: false,
      whatsappE164: "+919820011012", company: "Rao Legal LLP", designation: "Managing Partner",
      industry: "Legal Services", city: "Pune", state: "Maharashtra", country: "India",
      linkedinUrl: "linkedin.com/in/isharao", bio: "Corporate & IP law.",
      areasOfInterest: "Governance, compliance", connectedToAltus: "Registered July 2026",
      resumeFileName: "isha-rao.docx",
    },
    resumePath: "resumes/al-002/isha-rao.docx", requestedAt: "2026-07-27T08:00:00Z",
    decision: "pending", decidedAt: null, decidedBy: null, rejectionReason: null,
  },
  {
    id: "req-003", allowlistId: "al-003", emailSubmitted: "kabir@shahsteel.co",
    payload: {
      fullName: "Kabir Shah", phoneE164: "+919820011003", whatsappSameAsPhone: true,
      whatsappE164: "+919820011003", company: "Shah Steel Traders", designation: "Director",
      industry: "Metals & Trading", city: "Ahmedabad", state: "Gujarat", country: "India",
      linkedinUrl: "linkedin.com/in/kabirshah", bio: "Stainless steel & industrial goods.",
      areasOfInterest: "Supply chain", connectedToAltus: "April 2026 Conclave",
      resumeFileName: "kabir-shah.pdf",
    },
    resumePath: "resumes/al-003/kabir-shah.pdf", requestedAt: "2026-07-19T09:00:00Z",
    decision: "approved", decidedAt: "2026-07-20T12:00:00Z", decidedBy: "admin-1", rejectionReason: null,
  },
];

export const seedImportRuns: ImportRun[] = [
  {
    id: "imp-apr", source: "April PDF", importedBy: null, totalParsed: 52,
    importedSuccessfully: 50, sentToReview: 0, mergeConflicts: 2, validationWarnings: 19,
    status: "dry_run", createdAt: "2026-07-28T12:00:00Z",
  },
  {
    id: "imp-jul", source: "July PDF", importedBy: null, totalParsed: 34,
    importedSuccessfully: 25, sentToReview: 7, mergeConflicts: 2, validationWarnings: 5,
    status: "dry_run", createdAt: "2026-07-28T12:00:00Z",
  },
];
