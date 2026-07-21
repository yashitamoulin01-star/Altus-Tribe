import "server-only";
import { cache } from "react";
import { loadEditable } from "@/lib/profile-edit";
import { composeFullName, computeProfileCompletion } from "@/lib/profile-fields";
import { getAllMembers } from "@/lib/members-data";
import type { MemberCover } from "@/lib/members";

// Dashboard data helpers (Phase 3). Each widget fetches independently; the
// per-user profile is shared across widgets via React cache() so the several
// widgets that need it (header, summary, suggestions) trigger just one load.

export interface MyProfileSummary {
  fullName: string;
  photoUrl: string | null;
  businessName: string;
  category: string;
  industry: string;
  natureOfBusiness: string;
  usp: string;
  completion: number;
  slug: string | null;
  hasIdentity: boolean;
}

export const getMyProfileSummary = cache(async (): Promise<MyProfileSummary> => {
  const state = await loadEditable();
  const d = state?.data;
  const fullName = d ? composeFullName(d) : "";
  return {
    fullName,
    photoUrl: d?.photoUrl || null,
    businessName: d?.businessName ?? "",
    category: d?.category ?? "",
    industry: d?.industry ?? "",
    natureOfBusiness: d?.natureOfBusiness ?? "",
    usp: d?.usp ?? "",
    completion: d ? computeProfileCompletion(d) : 0,
    slug: state?.slug ?? null,
    hasIdentity: Boolean(fullName),
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
  if (myIndustry) {
    others.sort((a, b) => {
      const am = a.industry.trim().toLowerCase() === myIndustry ? 0 : 1;
      const bm = b.industry.trim().toLowerCase() === myIndustry ? 0 : 1;
      return am - bm;
    });
  }
  return others.slice(0, limit);
}
