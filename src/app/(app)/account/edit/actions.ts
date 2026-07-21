"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { failFrom } from "@/lib/validation/actions";
import {
  capsName,
  composeFullName,
  isFileKind,
  type EditableAddress,
  type EditableProfile,
  type FieldVisibility,
} from "@/lib/profile-fields";

export type SaveResult = { ok: true } | { ok: false; error: string };

const SAVE_FAILED = "Couldn't save your feature. Please try again.";

const clean = (s: string) => {
  const t = s.trim();
  return t.length ? t : null;
};

// Persists the full editable profile + per-field visibility. Without `targetId`
// it saves the signed-in member's own profile. With `targetId` (admin editing
// another member, P3) the caller must be an admin. RLS also enforces this: the
// "admins manage profiles" / "owner or admin writes child" policies allow it.
export async function saveProfile(
  d: EditableProfile,
  visibility: FieldVisibility,
  targetId?: string,
): Promise<SaveResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "not-configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not-signed-in" };

  // Resolve whose profile is being written, authorizing admin edits of others.
  let profileId = user.id;
  if (targetId && targetId !== user.id) {
    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (me?.role !== "admin") return { ok: false, error: "forbidden" };
    profileId = targetId;
  }

  const firstName = capsName(d.firstName.trim());
  const middleName = capsName(d.middleName.trim());
  const lastName = capsName(d.lastName.trim());
  const fullName =
    composeFullName({ firstName, middleName, lastName }) || "Member";

  const { error: pErr } = await supabase
    .from("profiles")
    .update({
      first_name: clean(firstName),
      middle_name: clean(middleName),
      last_name: clean(lastName),
      full_name: fullName,
      role_title: clean(d.roleTitle),
      industry: clean(d.industry),
      category: clean(d.category),
      city: clean(d.city),
      brand_names: clean(d.brandNames),
      cell_no: clean(d.cellNo),
      alt_no: clean(d.altNo),
      work_email: clean(d.workEmail),
      personal_email: clean(d.personalEmail),
      positioning: clean(d.positioning),
      known_for: clean(d.knownFor),
      about: clean(d.about),
      company_website: clean(d.companyWebsite),
      photo_url: clean(d.photoUrl),
      company_logo_url: clean(d.companyLogoUrl),
      nature_of_business: clean(d.natureOfBusiness),
      usp: clean(d.usp),
      linkedin_url: clean(d.linkedin),
      github_url: clean(d.github),
      business_instagram: clean(d.businessInstagram),
      personal_instagram: clean(d.personalInstagram),
      youtube_url: clean(d.youtube),
      telegram_url: clean(d.telegram),
      whatsapp_link: clean(d.whatsappLink),
      custom_link: clean(d.customLink),
      whatsapp_dm: d.whatsappDm,
      best_time: clean(d.bestTime),
      best_modes: d.bestModes.filter((m) =>
        ["call", "whatsapp", "email", "dnd"].includes(m),
      ),
      birth_date: clean(d.birthDate),
      anniversary: clean(d.anniversary),
      marital_status: clean(d.maritalStatus),
      blood_group: clean(d.bloodGroup),
      areas_of_interest: clean(d.areasOfInterest),
      purpose: clean(d.purpose),
      favourite_tools: clean(d.favouriteTools),
      network_groups: clean(d.networkGroups),
      can_connect: clean(d.canConnect),
      want_connect: clean(d.wantConnect),
      contribution: clean(d.contribution),
      interested_helping: clean(d.interestedHelping),
      interested_coaching: clean(d.interestedCoaching),
      interested_networking: clean(d.interestedNetworking),
      program_benefit_work: clean(d.programBenefitWork),
      program_benefit_personal: clean(d.programBenefitPersonal),
      field_visibility: visibility,
    })
    .eq("id", profileId);
  if (pErr) return failFrom("saveProfile", pErr, SAVE_FAILED, { userId: user.id });

  // Business (1:1)
  const { error: bErr } = await supabase.from("businesses").upsert({
    profile_id: profileId,
    name: clean(d.businessName),
    description: clean(d.businessDescription),
    website: clean(d.companyWebsite),
    team_size: clean(d.teamSize),
    founded_year: d.foundedYear.trim() ? Number(d.foundedYear) : null,
  });
  if (bErr) return failFrom("saveProfile", bErr, SAVE_FAILED, { userId: user.id });

  // Addresses (one row per kind). Upsert when it has content, delete when cleared.
  const saveAddress = async (kind: "work" | "home" | "factory", a: EditableAddress) => {
    const hasContent = Object.values(a).some((v) => v.trim().length > 0);
    if (hasContent) {
      return supabase.from("addresses").upsert(
        {
          profile_id: profileId,
          kind,
          line1: clean(a.line1),
          line2: clean(a.line2),
          line3: clean(a.line3),
          line4: clean(a.line4),
          landmark: clean(a.landmark),
          city: clean(a.city),
          state: clean(a.state),
          country: clean(a.country),
          pincode: clean(a.pincode),
          map_link: clean(a.mapLink),
        },
        { onConflict: "profile_id,kind" },
      );
    }
    return supabase
      .from("addresses")
      .delete()
      .eq("profile_id", profileId)
      .eq("kind", kind);
  };

  for (const [kind, a] of [
    ["work", d.workAddress],
    ["home", d.homeAddress],
    ["factory", d.factoryAddress],
  ] as const) {
    const { error: aErr } = await saveAddress(kind, a);
    if (aErr) return failFrom("saveProfile", aErr, SAVE_FAILED, { userId: user.id });
  }

  // Portfolio attachments (replace-all into work_items, max enforced client-side)
  const { error: wDelErr } = await supabase
    .from("work_items")
    .delete()
    .eq("profile_id", profileId);
  if (wDelErr) return failFrom("saveProfile", wDelErr, SAVE_FAILED, { userId: user.id });

  const attachments = d.attachments
    .filter((w) =>
      isFileKind(w.kind) ? w.filePath.trim() : w.url.trim(),
    )
    .slice(0, 5);
  if (attachments.length) {
    const { error: wInsErr } = await supabase.from("work_items").insert(
      attachments.map((w, i) => ({
        profile_id: profileId,
        kind: w.kind,
        title: clean(w.title),
        external_url: isFileKind(w.kind) ? null : clean(w.url),
        file_path: isFileKind(w.kind) ? clean(w.filePath) : null,
        sort_order: i,
      })),
    );
    if (wInsErr) return failFrom("saveProfile", wInsErr, SAVE_FAILED, { userId: user.id });
  }

  // Expertise (replace-all)
  const labels = d.expertise.map((l) => l.trim()).filter(Boolean);
  const { error: delErr } = await supabase
    .from("expertise")
    .delete()
    .eq("profile_id", profileId);
  if (delErr) return failFrom("saveProfile", delErr, SAVE_FAILED, { userId: user.id });
  if (labels.length) {
    const { error: insErr } = await supabase
      .from("expertise")
      .insert(labels.map((label, i) => ({ profile_id: profileId, label, sort_order: i })));
    if (insErr) return failFrom("saveProfile", insErr, SAVE_FAILED, { userId: user.id });
  }

  if (targetId && targetId !== user.id) {
    // Admin edited another member — refresh their admin detail + public feature.
    revalidatePath(`/admin/members/${profileId}`);
    revalidatePath("/admin/members");
  } else {
    revalidatePath("/account");
  }
  return { ok: true };
}
