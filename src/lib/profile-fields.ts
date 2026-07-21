// Client-safe profile editing infrastructure: the editable shape, the canonical
// list of per-field privacy toggles (👁), and validation helpers. Shared by the
// Edit composer (client) and the save action (server).

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
  whatsappDm: boolean;
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
  { key: "areas_of_interest", label: "Areas of interest" },
  { key: "network_groups", label: "Associations" },
  { key: "can_connect", label: "Can connect others to" },
  { key: "want_connect", label: "Want to connect with" },
  { key: "contribution", label: "Contribution to the Tribe" },
];

export type FieldVisibility = Record<string, boolean>;

// A field is shown unless the member has explicitly turned it off.
export function isFieldVisible(v: FieldVisibility, key: string): boolean {
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
      return /^\d{10}$/.test(v) ? null : "Enter a 10-digit number.";
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
