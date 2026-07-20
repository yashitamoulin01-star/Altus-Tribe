import "server-only";
import { createClient } from "@/lib/supabase/server";

// Private CRM data layer (docs/12 §3, A1–A22). RLS restricts participant_admin /
// participant_assets / admin_notes to admins and the participant's designated
// consultant — members have NO select policy, so this can never leak to the app.
// Offline/unmigrated → sample CRM so the admin preview renders.

export type RatingTier =
  | "ambassador" | "mentor" | "coach" | "expert" | "practitioner" | "observer";

export interface CrmImpact {
  testimonial?: string; // A10
  turnover?: string; // A13
  tangible?: string; // A14
  kpi_time?: string; // A15
  productivity?: string; // A16
  time_saved?: string; // A17
  delegation?: string; // A18
  work_life?: string; // A19
  habits?: string; // A20
}

export interface CrmRecord {
  profileId: string;
  referredBy: string; // A1
  breakthrough: string; // A2
  designatedConsultant: string | null; // A11
  upsellPossible: boolean; // A12
  rating: RatingTier | null; // A22
  impact: CrmImpact; // A10, A13–A20
}

export interface CrmAsset {
  id: string;
  kind: string; // A3–A9, A21
  body: string | null;
  url: string | null;
}

const schemaMissing = (e: { code?: string } | null) =>
  e?.code === "PGRST205" || e?.code === "42P01";

const SAMPLE_CRM: CrmRecord = {
  profileId: "sample",
  referredBy: "Manan Vasa (PS-12 orientation)",
  breakthrough: "Delegated daily ops and reclaimed ~12 hrs/week; launched a second product line.",
  designatedConsultant: null,
  upsellPossible: true,
  rating: "mentor",
  impact: {
    testimonial: "The Tribe changed how I run my company.",
    turnover: "+38% YoY",
    productivity: "+2 focused hours/day",
    delegation: "Now runs a 3-person ops pod",
    work_life: "Weekends fully offline",
  },
};

export async function getCrm(profileId: string): Promise<{
  record: CrmRecord;
  assets: CrmAsset[];
}> {
  const supabase = await createClient();
  if (!supabase) return { record: { ...SAMPLE_CRM, profileId }, assets: [] };

  const { data, error } = await supabase
    .from("participant_admin")
    .select("profile_id, referred_by, breakthrough, designated_consultant, upsell_possible, rating, impact")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error && schemaMissing(error)) {
    return { record: { ...SAMPLE_CRM, profileId }, assets: [] };
  }

  const record: CrmRecord = data
    ? {
        profileId,
        referredBy: (data.referred_by as string) ?? "",
        breakthrough: (data.breakthrough as string) ?? "",
        designatedConsultant: (data.designated_consultant as string) ?? null,
        upsellPossible: Boolean(data.upsell_possible),
        rating: (data.rating as RatingTier) ?? null,
        impact: (data.impact as CrmImpact) ?? {},
      }
    : {
        profileId,
        referredBy: "",
        breakthrough: "",
        designatedConsultant: null,
        upsellPossible: false,
        rating: null,
        impact: {},
      };

  const { data: assetRows } = await supabase
    .from("participant_assets")
    .select("id, kind, body, url")
    .eq("profile_id", profileId);

  const assets: CrmAsset[] = (assetRows ?? []).map((a) => ({
    id: a.id as string,
    kind: a.kind as string,
    body: (a.body as string) ?? null,
    url: (a.url as string) ?? null,
  }));

  return { record, assets };
}
