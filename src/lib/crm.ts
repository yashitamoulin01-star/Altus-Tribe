import "server-only";
import { createClient } from "@/lib/supabase/server";
export { CRM_ASSET_FIELDS } from "@/lib/crm-fields";

// Private CRM data layer (docs/12 §3, A1–A22). RLS restricts participant_admin /
// participant_assets / admin_notes to admins and the participant's designated
// consultant — members have NO select policy, so this can never leak to the app.
// Offline/unmigrated → sample CRM so the admin preview renders.

export type RatingTier =
  | "ambassador" | "mentor" | "coach" | "expert" | "practitioner" | "observer";

// Evidence images live in the PRIVATE crm-assets bucket, so reads need a
// short-lived signed URL — never a public URL and never persisted back to
// Postgres. Kept intentionally short (10 min) so evidence links can't leak long.
export const CRM_SIGNED_URL_TTL_SECONDS = 600;

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
  rating: RatingTier | null; // A22 (legacy single value — preserved, superseded by classifications)
  classifications: string[]; // A22 — multi-select (ambassador/mentor/coach/expert/practitioner/observer)
  impact: CrmImpact; // A10, A13–A20
}

export interface CrmAsset {
  id: string;
  kind: string; // A3–A9, A21 — one of CRM_ASSET_FIELDS[].kind
  body: string | null;
  url: string | null;
  image: string | null; // canonical: storage PATH in crm-assets (or a pasted http URL)
  imageUrl: string | null; // read-time only: short-lived signed URL (never persisted)
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
  classifications: ["mentor", "expert"],
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

  // A22 classifications live on the same row but in a column added by a later
  // migration. Read it separately + best-effort so the CRM still loads fully if
  // the migration hasn't been applied live yet (undefined_column → []).
  const classifications = await getClassifications(supabase, profileId);

  const record: CrmRecord = data
    ? {
        profileId,
        referredBy: (data.referred_by as string) ?? "",
        breakthrough: (data.breakthrough as string) ?? "",
        designatedConsultant: (data.designated_consultant as string) ?? null,
        upsellPossible: Boolean(data.upsell_possible),
        rating: (data.rating as RatingTier) ?? null,
        classifications,
        impact: (data.impact as CrmImpact) ?? {},
      }
    : {
        profileId,
        referredBy: "",
        breakthrough: "",
        designatedConsultant: null,
        upsellPossible: false,
        rating: null,
        classifications,
        impact: {},
      };

  const { data: assetRows } = await supabase
    .from("participant_assets")
    .select("id, kind, body, url, image_path")
    .eq("profile_id", profileId);

  const assets: CrmAsset[] = (assetRows ?? []).map((a) => ({
    id: a.id as string,
    kind: a.kind as string,
    body: (a.body as string) ?? null,
    url: (a.url as string) ?? null,
    image: (a.image_path as string) ?? null,
    imageUrl: null,
  }));

  await signAssetImages(supabase, assets);

  return { record, assets };
}

// Best-effort read of the A22 multi-select column. Isolated so a not-yet-applied
// migration (Postgres 42703 undefined_column) degrades to [] instead of failing
// the whole CRM load.
async function getClassifications(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  profileId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("participant_admin")
    .select("classifications")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error || !data) return [];
  const raw = (data as { classifications?: unknown }).classifications;
  return Array.isArray(raw) ? (raw as string[]) : [];
}

// Resolve read-time signed URLs for private evidence images. Storage paths get a
// short-lived signed URL via the AUTHENTICATED server client, so the existing
// crm-assets RLS (admin OR the participant's designated consultant) is what
// authorizes each object — no service role, no scope widening. Pasted http(s)
// URLs pass through as-is. Any signing failure leaves imageUrl null (the UI shows
// an unavailable state) rather than throwing. Never persisted back to Postgres.
async function signAssetImages(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  assets: CrmAsset[],
): Promise<void> {
  const isHttp = (s: string) => /^https?:\/\//i.test(s);
  for (const a of assets) {
    if (a.image && isHttp(a.image)) a.imageUrl = a.image;
  }
  const toSign = assets.filter((a) => a.image && !isHttp(a.image));
  if (!toSign.length) return;

  try {
    const { data, error } = await supabase.storage
      .from("crm-assets")
      .createSignedUrls(toSign.map((a) => a.image as string), CRM_SIGNED_URL_TTL_SECONDS);
    if (error || !data) return;
    const byPath = new Map<string, string>();
    for (const d of data) {
      if (d.path && d.signedUrl) byPath.set(d.path, d.signedUrl);
    }
    for (const a of toSign) a.imageUrl = byPath.get(a.image as string) ?? null;
  } catch {
    // Storage unreachable / bucket missing → leave imageUrl null (graceful).
  }
}
