// Sample data shaped to the Phase 4 schema (docs/04-database-schema.md).
// Yashita Mouli is placeholder/demo content — swap for a real member anytime.
// The shape here mirrors the `profiles` table + its child tables 1:1.

export type WorkKind = "brochure" | "video" | "image" | "case_study";
export type OpenToOption =
  | "mentoring"
  | "partnerships"
  | "referrals"
  | "speaking"
  | "hiring";

// A postal address, already stripped to its non-empty display lines.
export interface MemberAddress {
  lines: string[]; // ordered, non-empty
  landmark?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  mapLink?: string;
}

// Contact fields, each individually gated by field visibility (null = hidden).
export interface MemberContact {
  cellNo: string | null;
  altNo: string | null;
  workEmail: string | null;
  personalEmail: string | null;
}

export interface Member {
  id?: string; // profile UUID — present from the DB; used to start a direct message
  slug: string;
  fullName: string;
  photoUrl: string | null;
  companyLogoUrl?: string | null;
  roleTitle: string; // "Founder"
  industry: string;
  city: string;
  positioning: string; // Hero: what they do
  knownFor: string | null; // the fingerprint line
  about: string | null; // the narrative
  expertise: string[]; // rendered slash-separated
  business: {
    name: string;
    description?: string;
    foundedYear?: number;
    teamSize?: string;
    website?: string;
  } | null;
  category?: string; // business category (directory filter)
  interests?: string; // areas of interest (directory search)
  offerings: { title: string; description?: string }[]; // What I Do
  work: { kind: WorkKind; title: string; href: string }[]; // Work
  openTo: OpenToOption[];
  presence: { platform: string; url: string }[];
  // P3 additions — populated from the DB and stripped for non-owners.
  contact?: MemberContact;
  addresses?: {
    work: MemberAddress | null;
    home: MemberAddress | null;
    factory: MemberAddress | null;
  };
  // Phase 4 — the complete identity. Fields with a privacy toggle are `| null`
  // (null = hidden for this viewer); the rest are plain optionals. All gating
  // happens in the data layer so components never handle privacy themselves.
  brandNames?: string;
  usp?: string;
  natureOfBusiness?: string;
  bestTime?: string;
  bestModes?: string[];
  whatsappDm?: boolean | null; // legacy, gated: "whatsapp"
  whatsappDmPref?: "yes" | "no" | "dnd" | null; // gated: "whatsapp"
  whatsapp?: string | null; // WhatsApp number (E.164), gated: "whatsapp"
  // Personal
  birthDate?: string | null; // gated: "birth_date"
  bloodGroup?: string;
  maritalStatus?: string | null; // gated: "marital_status"
  anniversary?: string | null; // gated: "anniversary"
  // Networking
  areasOfInterest?: string | null; // gated: "areas_of_interest"
  networkGroups?: string | null; // gated: "network_groups"
  canConnect?: string | null; // gated: "can_connect"
  wantConnect?: string | null; // gated: "want_connect"
  favouriteTools?: string;
  purpose?: string;
  contribution?: string | null; // gated: "contribution"
  // Community
  interestedHelping?: string;
  interestedCoaching?: string;
  interestedNetworking?: string;
  // Program journey
  programBenefitWork?: string;
  programBenefitPersonal?: string;
  cqBatch?: string;
  psBatch?: string;
  bssBatch?: string;
  conclavesAttended?: number | null;
}

// Bundled sample data — used as an offline fallback when Supabase is not
// configured. The DB is the source of truth once env vars are set.
export const sampleMembers: Member[] = [
  {
    slug: "yashita-mouli",
    fullName: "Yashita Mouli",
    photoUrl: null, // no photo yet — layout must hold without one
    roleTitle: "Founder",
    industry: "Manufacturing",
    city: "Mumbai",
    positioning:
      "Helping Indian manufacturers build sustainable export businesses.",
    category: "Products",
    interests: "Sustainability, Exports, Manufacturing, Climate",
    knownFor: "Built India's first fully compostable FMCG packaging line.",
    about:
      "Yashita left a corporate supply-chain role in 2018 to prove that sustainable packaging could be profitable, not just principled. Today GreenWrap supplies compostable packaging to FMCG brands across three continents — and she's still the person who walks the factory floor every morning.",
    expertise: ["Manufacturing", "Exports", "B2B Sales", "Sustainability"],
    business: {
      name: "GreenWrap Industries",
      description:
        "Compostable, export-grade packaging for FMCG brands that want to ship responsibly.",
      foundedYear: 2018,
      teamSize: "40 people",
      website: "greenwrap.in",
    },
    offerings: [
      {
        title: "Compostable FMCG packaging",
        description: "Retail-ready, certified compostable, at production scale.",
      },
      {
        title: "Custom export-grade cartons",
        description: "Engineered for long-haul freight and customs compliance.",
      },
    ],
    work: [
      { kind: "brochure", title: "Company brochure", href: "#" },
      { kind: "video", title: "Factory tour", href: "#" },
      { kind: "case_study", title: "Scaling to 3 continents", href: "#" },
    ],
    openTo: ["partnerships", "mentoring", "speaking"],
    presence: [
      { platform: "Website", url: "https://greenwrap.in" },
      { platform: "LinkedIn", url: "#" },
      { platform: "Email", url: "mailto:yashita@greenwrap.in" },
    ],
  },
  {
    slug: "arjun-nair",
    fullName: "Arjun Nair",
    photoUrl: null,
    roleTitle: "Founder",
    industry: "Fintech",
    city: "Bengaluru",
    positioning:
      "Making working-capital credit reach India's small merchants in minutes, not weeks.",
    category: "Services",
    interests: "Fintech, Credit, Startups, Financial Inclusion",
    knownFor: "Underwrote ₹500 Cr in merchant credit with a 12-person team.",
    about:
      "Arjun spent six years inside a large bank watching good businesses get turned away for want of a credit history. LedgerLoop reads a merchant's real cash flow instead of their paperwork — and approves in the time it takes to make chai.",
    expertise: ["Fintech", "Credit Risk", "Product", "Growth"],
    business: {
      name: "LedgerLoop",
      description:
        "Cash-flow-based lending for India's small merchants — approvals in minutes.",
      foundedYear: 2020,
      teamSize: "12 people",
      website: "ledgerloop.com",
    },
    offerings: [
      {
        title: "Merchant working-capital lines",
        description: "Revolving credit priced on live cash flow, not collateral.",
      },
      {
        title: "Embedded lending API",
        description: "Drop-in credit for marketplaces and POS platforms.",
      },
    ],
    work: [
      { kind: "case_study", title: "₹500 Cr, 12 people", href: "#" },
      { kind: "brochure", title: "Partner deck", href: "#" },
    ],
    openTo: ["partnerships", "hiring", "referrals"],
    presence: [
      { platform: "Website", url: "https://ledgerloop.com" },
      { platform: "LinkedIn", url: "#" },
      { platform: "Email", url: "mailto:arjun@ledgerloop.com" },
    ],
  },
  {
    slug: "priya-deshmukh",
    fullName: "Priya Deshmukh",
    photoUrl: null,
    roleTitle: "Creative Director",
    industry: "Design",
    city: "Pune",
    positioning:
      "Turning founder stories into brands people actually remember.",
    category: "Services",
    interests: "Branding, Design, Storytelling, D2C",
    knownFor: "Rebranded 40+ D2C labels; three became category leaders.",
    about:
      "Priya believes a brand is a promise kept in public. Her studio, Northlight, works only with founders who have something real to say — then makes sure the world can't look away.",
    expertise: ["Branding", "Design", "Storytelling", "D2C"],
    business: {
      name: "Northlight Studio",
      description:
        "A brand studio for founder-led companies with a point of view.",
      foundedYear: 2017,
      teamSize: "8 people",
      website: "northlight.studio",
    },
    offerings: [
      {
        title: "Brand identity systems",
        description: "Naming, voice, and visual language, end to end.",
      },
      {
        title: "Founder narrative",
        description: "The story that makes a brand worth following.",
      },
    ],
    work: [
      { kind: "image", title: "Selected work", href: "#" },
      { kind: "case_study", title: "Three category leaders", href: "#" },
    ],
    openTo: ["mentoring", "speaking", "partnerships"],
    presence: [
      { platform: "Website", url: "https://northlight.studio" },
      { platform: "Instagram", url: "#" },
      { platform: "Email", url: "mailto:priya@northlight.studio" },
    ],
  },
  {
    slug: "rohan-mehta",
    fullName: "Rohan Mehta",
    photoUrl: null,
    roleTitle: "Founder",
    industry: "Logistics",
    city: "Delhi",
    positioning:
      "Getting fragile, high-value goods across India without a single scratch.",
    category: "Solutions",
    interests: "Logistics, Operations, Supply Chain, B2B",
    knownFor: "Cut damage-in-transit to under 0.2% across 30 cities.",
    about:
      "After watching a shipment of lab equipment arrive in pieces, Rohan built CrateRoute around one obsession: things arrive exactly as they left. It turns out a lot of businesses will pay well for that certainty.",
    expertise: ["Logistics", "Operations", "Supply Chain", "B2B"],
    business: {
      name: "CrateRoute",
      description:
        "Specialised transport for fragile, high-value freight across India.",
      foundedYear: 2019,
      teamSize: "60 people",
      website: "crateroute.in",
    },
    offerings: [
      {
        title: "White-glove freight",
        description: "Climate-aware handling for sensitive cargo.",
      },
      {
        title: "Damage-guarantee SLAs",
        description: "Contractual damage caps backed by real tracking.",
      },
    ],
    work: [
      { kind: "video", title: "Inside the network", href: "#" },
      { kind: "brochure", title: "Service overview", href: "#" },
    ],
    openTo: ["partnerships", "referrals"],
    presence: [
      { platform: "Website", url: "https://crateroute.in" },
      { platform: "LinkedIn", url: "#" },
      { platform: "Email", url: "mailto:rohan@crateroute.in" },
    ],
  },
];

// Lightweight shape for the Explore People gallery — just what a cover card needs.
export interface MemberCover {
  id: string; // profile UUID — for connection state/actions
  slug: string;
  fullName: string;
  photoUrl: string | null;
  roleTitle: string;
  industry: string;
  city: string;
  positioning: string;
  businessName: string; // Search Business / Company (#158, #162)
  category: string; // Search Category (#160)
  interests: string; // Search Interest (#161)
  createdAt: string; // profile created_at — for "Recently joined"
  openTo: OpenToOption[]; // referral/mentoring/etc. — for the "Open to" filter
}

// Pure projection Member -> MemberCover. Used by both the DB and fallback paths.
export function toCover(m: Member): MemberCover {
  return {
    id: m.id ?? m.slug,
    slug: m.slug,
    fullName: m.fullName,
    photoUrl: m.photoUrl,
    roleTitle: m.roleTitle,
    industry: m.industry,
    city: m.city,
    positioning: m.positioning,
    businessName: m.business?.name ?? "",
    category: m.category ?? "",
    interests: m.interests ?? "",
    createdAt: "",
    openTo: m.openTo ?? [],
  };
}
