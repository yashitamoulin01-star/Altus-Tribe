import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  emptyEditable,
  type AttachmentKind,
  type EditableAddress,
  type EditableProfile,
  type FieldVisibility,
} from "@/lib/profile-fields";

export interface EditableState {
  data: EditableProfile;
  visibility: FieldVisibility;
  slug: string | null;
  userId: string;
}

export interface Taxonomies {
  industry: string[];
  category: string[];
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

type AddressRow = {
  kind: string;
  line1: string | null;
  line2: string | null;
  line3: string | null;
  line4: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  map_link: string | null;
};

// Map a raw addresses row (or undefined) to the editable shape.
function toAddress(a: AddressRow | undefined): EditableAddress {
  return {
    line1: str(a?.line1),
    line2: str(a?.line2),
    line3: str(a?.line3),
    line4: str(a?.line4),
    landmark: str(a?.landmark),
    city: str(a?.city),
    state: str(a?.state),
    country: str(a?.country),
    pincode: str(a?.pincode),
    mapLink: str(a?.map_link),
  };
}

// Loads a member's full editable profile. Without `targetId` this is the
// signed-in member's own profile. With `targetId` (admin editing another member,
// P3) the caller must be an admin — otherwise null. Returns null when
// unconfigured or signed out.
export async function loadEditable(
  targetId?: string,
): Promise<EditableState | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Resolve whose profile we're loading, authorizing admin access to others.
  let profileId = user.id;
  if (targetId && targetId !== user.id) {
    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (me?.role !== "admin") return null;
    profileId = targetId;
  }

  const [
    { data: p },
    { data: biz },
    { data: expertiseRows },
    { data: addrRows },
    { data: workRows },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", profileId).maybeSingle(),
    supabase
      .from("businesses")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle(),
    supabase
      .from("expertise")
      .select("label, sort_order")
      .eq("profile_id", profileId)
      .order("sort_order"),
    supabase.from("addresses").select("*").eq("profile_id", profileId),
    supabase
      .from("work_items")
      .select("kind, title, external_url, file_path, sort_order")
      .eq("profile_id", profileId)
      .order("sort_order"),
  ]);

  const addrByKind = new Map(
    ((addrRows ?? []) as AddressRow[]).map((a) => [a.kind, a]),
  );

  if (!p) {
    return { data: { ...emptyEditable }, visibility: {}, slug: null, userId: profileId };
  }

  const data: EditableProfile = {
    firstName: str(p.first_name),
    middleName: str(p.middle_name),
    lastName: str(p.last_name),
    roleTitle: str(p.role_title),
    industry: str(p.industry),
    category: str(p.category),
    city: str(p.city),
    brandNames: str(p.brand_names),
    cellNo: str(p.cell_no),
    altNo: str(p.alt_no),
    workEmail: str(p.work_email),
    personalEmail: str(p.personal_email),
    workAddress: toAddress(addrByKind.get("work")),
    homeAddress: toAddress(addrByKind.get("home")),
    factoryAddress: toAddress(addrByKind.get("factory")),
    photoUrl: str(p.photo_url),
    companyLogoUrl: str(p.company_logo_url),
    attachments: (workRows ?? []).map((w) => ({
      kind: (w.kind as AttachmentKind) ?? "brochure",
      title: str(w.title),
      url: str(w.external_url),
      filePath: str(w.file_path),
    })),
    positioning: str(p.positioning),
    knownFor: str(p.known_for),
    about: str(p.about),
    businessName: str(biz?.name),
    businessDescription: str(biz?.description),
    companyWebsite: str(p.company_website) || str(biz?.website),
    foundedYear: biz?.founded_year ? String(biz.founded_year) : "",
    teamSize: str(biz?.team_size),
    natureOfBusiness: str(p.nature_of_business),
    usp: str(p.usp),
    expertise: (expertiseRows ?? []).map((e) => e.label as string),
    linkedin: str(p.linkedin_url),
    github: str(p.github_url),
    businessInstagram: str(p.business_instagram),
    personalInstagram: str(p.personal_instagram),
    youtube: str(p.youtube_url),
    telegram: str(p.telegram_url),
    whatsappLink: str(p.whatsapp_link),
    customLink: str(p.custom_link),
    whatsappDm: Boolean(p.whatsapp_dm),
    bestTime: str(p.best_time),
    bestModes: Array.isArray(p.best_modes) ? (p.best_modes as string[]) : [],
    birthDate: str(p.birth_date),
    anniversary: str(p.anniversary),
    maritalStatus: str(p.marital_status),
    bloodGroup: str(p.blood_group),
    areasOfInterest: str(p.areas_of_interest),
    purpose: str(p.purpose),
    favouriteTools: str(p.favourite_tools),
    networkGroups: str(p.network_groups),
    canConnect: str(p.can_connect),
    wantConnect: str(p.want_connect),
    contribution: str(p.contribution),
    interestedHelping: str(p.interested_helping),
    interestedCoaching: str(p.interested_coaching),
    interestedNetworking: str(p.interested_networking),
    programBenefitWork: str(p.program_benefit_work),
    programBenefitPersonal: str(p.program_benefit_personal),
    visibility:
      p.visibility === "public" || p.visibility === "private"
        ? p.visibility
        : "tribe",
  };

  const visibility =
    p.field_visibility && typeof p.field_visibility === "object"
      ? (p.field_visibility as FieldVisibility)
      : {};

  return { data, visibility, slug: str(p.slug) || null, userId: profileId };
}

export async function getTaxonomies(): Promise<Taxonomies> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      industry: ["Manufacturing", "Fintech", "Design", "Logistics"],
      category: ["Products", "Services", "Solutions"],
    };
  }
  const { data } = await supabase
    .from("taxonomies")
    .select("kind, value")
    .order("sort_order");

  const pick = (kind: string) =>
    (data ?? []).filter((t) => t.kind === kind).map((t) => t.value as string);

  return { industry: pick("industry"), category: pick("category") };
}
