import "server-only";
import { cache } from "react";
import { loadEditable } from "@/lib/profile-edit";
import { composeFullName, computeProfileCompletion, requiredSetupMissing } from "@/lib/profile-fields";
import { getAllMembers } from "@/lib/members-data";
import type { MemberCover } from "@/lib/members";

// Dashboard data helpers (Phase 3). Each widget fetches independently; the
// per-user profile is shared across widgets via React cache() so the several
// widgets that need it (header, summary, suggestions) trigger just one load.

export interface MyProfileSummary {
  fullName: string;
  displayName: string; // name, else business, else "Member" — always safe to show
  photoUrl: string | null;
  businessName: string;
  category: string;
  industry: string;
  natureOfBusiness: string;
  usp: string;
  email: string;
  phone: string;
  completion: number;
  requiredComplete: boolean; // all required onboarding fields present
  slug: string | null;
  hasIdentity: boolean;
}

export const getMyProfileSummary = cache(async (): Promise<MyProfileSummary> => {
  const state = await loadEditable();
  const d = state?.data;
  const fullName = d ? composeFullName(d) : "";
  const businessName = d?.businessName ?? "";
  const photoUrl = d?.photoUrl || null;
  // A member "has identity" once they've entered ANY core detail — not just a
  // composed first+last name. This keeps the home header from falling back to
  // the generic "Welcome to the Tribe / Complete your profile" placeholder after
  // a member has clearly started (name, business, or photo present).
  const hasIdentity = Boolean(fullName || businessName || photoUrl);
  return {
    fullName,
    displayName: fullName || businessName || "Member",
    photoUrl,
    businessName,
    category: d?.category ?? "",
    industry: d?.industry ?? "",
    natureOfBusiness: d?.natureOfBusiness ?? "",
    usp: d?.usp ?? "",
    email: d?.workEmail || d?.personalEmail || "",
    phone: d?.cellNo || d?.whatsappLink || "",
    completion: d ? computeProfileCompletion(d) : 0,
    requiredComplete: d ? requiredSetupMissing(d).length === 0 : false,
    slug: state?.slug ?? null,
    hasIdentity,
  };
});

// Members to suggest: everyone except me, with same-industry matches surfaced
// first (a light "based on industry" ranking). Falls back to sample members
// offline, like the rest of the data layer.
export async function getSuggestedMembers(limit = 4): Promise<MemberCover[]> {
  const [me, members] = await Promise.all([
    getMyProfileSummary(),
    getAllMembers(),
  ]);
  const others = members.filter((m) => m.slug !== me.slug);
  const myIndustry = me.industry.trim().toLowerCase();
  // Admin-featured members float first, then same-industry matches (stable).
  const score = (m: MemberCover) =>
    (m.featured ? 0 : 2) +
    (myIndustry && m.industry.trim().toLowerCase() === myIndustry ? 0 : 1);
  others.sort((a, b) => score(a) - score(b));
  return others.slice(0, limit);
}
