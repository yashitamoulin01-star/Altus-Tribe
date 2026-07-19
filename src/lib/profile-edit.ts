import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  emptyEditable,
  type EditableProfile,
  type FieldVisibility,
} from "@/lib/profile-fields";

export interface EditableState {
  data: EditableProfile;
  visibility: FieldVisibility;
  slug: string | null;
}

export interface Taxonomies {
  industry: string[];
  category: string[];
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

// Loads the signed-in member's full editable profile. null when unconfigured
// or signed out.
export async function loadEditable(): Promise<EditableState | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: p }, { data: biz }, { data: expertiseRows }, { data: addr }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("businesses")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase
        .from("expertise")
        .select("label, sort_order")
        .eq("profile_id", user.id)
        .order("sort_order"),
      supabase
        .from("addresses")
        .select("*")
        .eq("profile_id", user.id)
        .eq("kind", "work")
        .maybeSingle(),
    ]);

  if (!p) {
    return { data: { ...emptyEditable }, visibility: {}, slug: null };
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
    workAddress: {
      line1: str(addr?.line1),
      line2: str(addr?.line2),
      line3: str(addr?.line3),
      line4: str(addr?.line4),
      landmark: str(addr?.landmark),
      city: str(addr?.city),
      state: str(addr?.state),
      country: str(addr?.country),
      pincode: str(addr?.pincode),
      mapLink: str(addr?.map_link),
    },
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
    businessInstagram: str(p.business_instagram),
    personalInstagram: str(p.personal_instagram),
    youtube: str(p.youtube_url),
    whatsappDm: Boolean(p.whatsapp_dm),
    bestTime: str(p.best_time),
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
  };

  const visibility =
    p.field_visibility && typeof p.field_visibility === "object"
      ? (p.field_visibility as FieldVisibility)
      : {};

  return { data, visibility, slug: str(p.slug) || null };
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
