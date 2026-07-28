// Client-safe profile editing infrastructure: the editable shape, the canonical
// list of per-field privacy toggles (👁), and validation helpers. Shared by the
// Edit composer (client) and the save action (server).

import { isValidPhone } from "@/lib/phone";

export interface EditableAddress {
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  landmark: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  mapLink: string;
}

// Portfolio attachment (max 5). File-based kinds (brochure/image) carry a
// storage `filePath`; link-based kinds (video/case_study) carry a `url`.
export type AttachmentKind = "brochure" | "video" | "image" | "case_study";

export interface EditableAttachment {
  kind: AttachmentKind;
  title: string;
  url: string; // external link (video / case_study)
  filePath: string; // storage path in work-files bucket (brochure / image)
}

export const MAX_ATTACHMENTS = 5;

export const ATTACHMENT_KIND_LABELS: Record<AttachmentKind, string> = {
  brochure: "Brochure",
  video: "Video",
  image: "Image",
  case_study: "Case study",
};

// Kinds whose content lives in storage (a file) vs. an external URL.
export const isFileKind = (k: AttachmentKind) =>
  k === "brochure" || k === "image";

export interface EditableProfile {
  // Identity
  firstName: string;
  middleName: string;
  lastName: string;
  roleTitle: string;
  industry: string;
  category: string;
  city: string;
  brandNames: string;
  // Contact
  cellNo: string;
  altNo: string;
  workEmail: string;
  personalEmail: string;
  // Addresses
  workAddress: EditableAddress;
  homeAddress: EditableAddress;
  factoryAddress: EditableAddress;
  // Media
  photoUrl: string;
  companyLogoUrl: string;
  // Portfolio (max 5)
  attachments: EditableAttachment[];
  // Headline / narrative
  positioning: string;
  knownFor: string;
  about: string;
  // Business
  businessName: string;
  businessDescription: string;
  companyWebsite: string;
  foundedYear: string;
  teamSize: string;
  natureOfBusiness: string;
  usp: string;
  // Expertise
  expertise: string[];
  // Presence
  linkedin: string;
  github: string;
  businessInstagram: string;
  personalInstagram: string;
  youtube: string;
  telegram: string;
  whatsappLink: string;
  customLink: string;
  whatsappDm: boolean; // legacy boolean (kept in sync for back-compat)
  whatsappDmPref: "yes" | "no" | "dnd"; // #28 canonical preference
  bestTime: string;
  bestModes: string[]; // #23 — subset of CONNECT_MODES
  // Personal
  birthDate: string;
  anniversary: string;
  maritalStatus: string;
  bloodGroup: string;
  areasOfInterest: string;
  purpose: string;
  favouriteTools: string;
  networkGroups: string;
  canConnect: string;
  wantConnect: string;
  contribution: string;
  interestedHelping: string;
  interestedCoaching: string;
  interestedNetworking: string;
  programBenefitWork: string; // #40
  programBenefitPersonal: string; // #41
  // Altus program (member-writable; admin can correct). #29/#30
  psBatch: string;
  cqBatch: string;
  bssBatch: string;
  // System-derived; read-only for members (admin-editable elsewhere). #48
  conclavesAttended: number;
  // Profile-level visibility (maps to profiles.visibility enum). Governs who can
  // see the whole feature; per-field show/hide is handled by field_visibility.
  visibility: "public" | "tribe" | "private";
}

// #23 Best Mode to Connect — maps to profiles.best_modes (connect_mode[] enum).
export const CONNECT_MODES: { value: string; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "dnd", label: "DND" },
];

// Exact grey embedded placeholder text for the address lines (spec §3/4/6). Used
// verbatim by both the onboarding wizard and the profile editor so they match.
export const ADDRESS_PLACEHOLDERS = {
  line1: "Address Line 1 / Unit Number / Floor Number / Lot Number",
  line2: "Building Name / Unit Name",
  line3: "Street Name / Road Name",
  line4: "Area Name / Sector Name",
  landmark: "Nearby landmark (optional)",
  pincode: "PIN / Postal code",
  city: "Start typing your city…",
  state: "Select or type your state",
  country: "Select or type your country",
  mapLink: "Google Maps link (optional)",
} as const;

// Grey example for "Best time to connect" (spec §10).
export const BEST_TIME_PLACEHOLDER = "e.g. 10:00 AM to 7:00 PM, Monday to Friday";

// Photo upload rule (spec §1): JPG/JPEG/PNG, 20 MB max.
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
export const PHOTO_ACCEPT = "image/jpeg,image/png";
export const PHOTO_HINT = "JPG, JPEG or PNG. Maximum size 20 MB.";
export const PHOTO_TOO_LARGE_MSG = "Maximum upload size is 20 MB.";

const emptyAddress: EditableAddress = {
  line1: "",
  line2: "",
  line3: "",
  line4: "",
  landmark: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  mapLink: "",
};

export const emptyEditable: EditableProfile = {
  firstName: "",
  middleName: "",
  lastName: "",
  roleTitle: "",
  industry: "",
  category: "",
  city: "",
  brandNames: "",
  cellNo: "",
  altNo: "",
  workEmail: "",
  personalEmail: "",
  workAddress: { ...emptyAddress },
  homeAddress: { ...emptyAddress },
  factoryAddress: { ...emptyAddress },
  photoUrl: "",
  companyLogoUrl: "",
  attachments: [],
  positioning: "",
  knownFor: "",
  about: "",
  businessName: "",
  businessDescription: "",
  companyWebsite: "",
  foundedYear: "",
  teamSize: "",
  natureOfBusiness: "",
  usp: "",
  expertise: [],
  linkedin: "",
  github: "",
  businessInstagram: "",
  personalInstagram: "",
  youtube: "",
  telegram: "",
  whatsappLink: "",
  customLink: "",
  whatsappDm: false,
  whatsappDmPref: "yes",
  bestTime: "",
  bestModes: [],
  birthDate: "",
  anniversary: "",
  maritalStatus: "",
  bloodGroup: "",
  areasOfInterest: "",
  purpose: "",
  favouriteTools: "",
  networkGroups: "",
  canConnect: "",
  wantConnect: "",
  contribution: "",
  interestedHelping: "",
  interestedCoaching: "",
  interestedNetworking: "",
  programBenefitWork: "",
  programBenefitPersonal: "",
  psBatch: "",
  cqBatch: "",
  bssBatch: "",
  conclavesAttended: 0,
  visibility: "tribe",
};

// Progress meter for onboarding + profile — the PRD's compulsory fields plus the
// content that makes a feature feel complete. One point each; addresses count if
// any line is filled.
const addressFilled = (a: EditableAddress) =>
  Object.values(a).some((v) => v.trim().length > 0);

const COMPLETION_CHECKS: ((d: EditableProfile) => boolean)[] = [
  (d) => d.firstName.trim().length > 0,
  (d) => d.lastName.trim().length > 0,
  (d) => d.photoUrl.trim().length > 0,
  (d) => d.about.trim().length > 0,
  (d) => d.bloodGroup.trim().length > 0,
  (d) => d.businessName.trim().length > 0,
  (d) => d.category.trim().length > 0,
  (d) => d.industry.trim().length > 0,
  (d) => d.natureOfBusiness.trim().length > 0,
  (d) => d.usp.trim().length > 0,
  (d) => d.cellNo.trim().length > 0,
  (d) => d.workEmail.trim().length > 0,
  (d) => d.bestModes.length > 0,
  (d) => addressFilled(d.workAddress),
  (d) => d.attachments.length > 0,
  (d) => d.linkedin.trim().length > 0,
  (d) => d.areasOfInterest.trim().length > 0,
  (d) => d.expertise.filter(Boolean).length > 0,
];

export function computeProfileCompletion(d: EditableProfile): number {
  const passed = COMPLETION_CHECKS.filter((c) => c(d)).length;
  return Math.round((passed / COMPLETION_CHECKS.length) * 100);
}

// --- Required-setup gate ----------------------------------------------------
// Source of truth = the owner's AUTHORITATIVE 48-field CQ Tribe matrix
// (2026-07-28). Only the participant-fillable "Mandatory: Yes" fields gate
// completion. NOT gated: #1 Photo, #13 Personal email, #16 Nature of business,
// #17 USP (matrix marks them "—"). #29/#30 PS/BSS batches are mandatory but
// ADMIN-FILLED / read-only for members, so they never block a member. Home &
// factory addresses are optional blocks. Work address requires ALL of line
// 1–4 + city/state/country/PIN. Returns human labels of what's still missing.
// See memory: form-48-field-spec.
const REQUIRED_SETUP: { label: string; ok: (d: EditableProfile) => boolean }[] = [
  { label: "First name", ok: (d) => d.firstName.trim().length > 0 },
  { label: "Last name", ok: (d) => d.lastName.trim().length > 0 },
  { label: "Business name", ok: (d) => d.businessName.trim().length > 0 },
  { label: "Cell number", ok: (d) => isValidPhone(d.cellNo) },
  { label: "Alternate number", ok: (d) => isValidPhone(d.altNo) },
  { label: "Work email", ok: (d) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.workEmail.trim()) },
  { label: "Work address", ok: (d) => [d.workAddress.line1, d.workAddress.line2, d.workAddress.line3, d.workAddress.line4, d.workAddress.city, d.workAddress.state, d.workAddress.country, d.workAddress.pincode].every((v) => v.trim().length > 0) },
  { label: "Business category", ok: (d) => d.category.trim().length > 0 },
  { label: "Industry / sector", ok: (d) => d.industry.trim().length > 0 },
  { label: "Best mode to connect", ok: (d) => d.bestModes.length > 0 },
  { label: "Birth date", ok: (d) => d.birthDate.trim().length > 0 },
  { label: "Blood group", ok: (d) => d.bloodGroup.trim().length > 0 },
];

export function requiredSetupMissing(d: EditableProfile): string[] {
  return REQUIRED_SETUP.filter((r) => !r.ok(d)).map((r) => r.label);
}

// Factory/warehouse address is optional, but IF the member starts filling it,
// the structured fields (incl. landmark, §7) become required. Returns missing
// labels only when the address has been started.
const FACTORY_STARTED = (a: EditableAddress) =>
  [a.line1, a.line2, a.line3, a.line4, a.landmark, a.pincode, a.city, a.state, a.country]
    .some((v) => v.trim().length > 0);

export function factoryAddressMissing(a: EditableAddress): string[] {
  if (!FACTORY_STARTED(a)) return [];
  const need: [string, string][] = [
    ["Address line 1", a.line1],
    ["PIN / postal code", a.pincode],
    ["City", a.city],
    ["State", a.state],
    ["Country", a.country],
  ];
  return need.filter(([, v]) => !v.trim()).map(([label]) => label);
}

// The fields a member can individually show/hide (spec "Permission to Show", 👁).
// Keys are stored in profiles.field_visibility as { key: boolean } (true = show).
export const VISIBILITY_FIELDS: { key: string; label: string }[] = [
  { key: "cell_no", label: "Cell number" },
  { key: "alt_no", label: "Alternate number" },
  { key: "work_email", label: "Work email" },
  { key: "personal_email", label: "Personal email" },
  { key: "work_address", label: "Work address" },
  { key: "home_address", label: "Home address" },
  { key: "factory_address", label: "Factory address" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "business_instagram", label: "Business Instagram" },
  { key: "personal_instagram", label: "Personal Instagram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "birth_date", label: "Birth date" },
  { key: "anniversary", label: "Anniversary" },
  { key: "marital_status", label: "Marital status" },
  { key: "blood_group", label: "Blood group" },
  { key: "areas_of_interest", label: "Areas of interest" },
  { key: "network_groups", label: "Associations" },
  { key: "can_connect", label: "Can connect others to" },
  { key: "want_connect", label: "Want to connect with" },
  { key: "contribution", label: "Contribution to the Tribe" },
  { key: "interested_helping", label: "Interested in helping others" },
  { key: "interested_coaching", label: "Interested in coaching / mentoring" },
  { key: "interested_networking", label: "Interested in business networking" },
];

export type FieldVisibility = Record<string, boolean>;

// Sensitive fields default to HIDDEN (conservative privacy, spec U14): the member
// must explicitly opt in to show them. Everything else defaults to shown.
const DEFAULT_HIDDEN = new Set([
  "blood_group",
  "birth_date",
  "anniversary",
  "marital_status",
  "home_address",
  "personal_email",
  "alt_no",
]);

// Visible if the member explicitly set it; otherwise the conservative default.
export function isFieldVisible(v: FieldVisibility, key: string): boolean {
  if (v[key] === undefined) return !DEFAULT_HIDDEN.has(key);
  return v[key] !== false;
}

// --- Validation ------------------------------------------------------------
export const capsName = (s: string) => s.toUpperCase();

export function validateField(
  field: keyof EditableProfile | "pincode",
  value: string,
): string | null {
  const v = value.trim();
  if (!v) return null; // emptiness handled by "mandatory" separately
  switch (field) {
    case "cellNo":
    case "altNo":
      return isValidPhone(v) ? null : "Enter a valid mobile number.";
    case "workEmail":
    case "personalEmail":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Enter a valid email.";
    case "companyWebsite":
      return /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/.test(v)
        ? null
        : "Enter a valid website (e.g. www.example.com).";
    case "pincode":
      return /^\d{4,6}$/.test(v) ? null : "Enter a valid pincode.";
    case "foundedYear":
      return /^\d{4}$/.test(v) ? null : "Enter a 4-digit year.";
    default:
      return null;
  }
}

// Compose the display name from parts (names are stored ALL CAPS per spec).
export function composeFullName(p: {
  firstName: string;
  middleName: string;
  lastName: string;
}): string {
  return [p.firstName, p.middleName, p.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}
