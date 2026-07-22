import "server-only";
import { getUser as getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyOnboarding, type OnboardingData } from "@/lib/onboarding-shared";
import { loadEditable } from "@/lib/profile-edit";
import type { EditableProfile, FieldVisibility } from "@/lib/profile-fields";

// Full onboarding state for the 8-module wizard: the complete 48-field editable
// profile (shared with the profile editor) plus resume metadata.
export interface OnboardingFullState {
  data: EditableProfile;
  visibility: FieldVisibility;
  slug: string | null;
  userId: string;
  step: number;
  completed: boolean;
  status: string | null;
}

// Reuses loadEditable (all 48 fields + visibility) and adds the resume cursor +
// completion/status. null when unconfigured or signed out.
export async function loadOnboardingFull(): Promise<OnboardingFullState | null> {
  const editable = await loadEditable();
  if (!editable) return null;

  const supabase = await createClient();
  if (!supabase) return null;
  const { data: p } = await supabase
    .from("profiles")
    .select("onboarding_step, onboarding_completed_at, status")
    .eq("id", editable.userId)
    .maybeSingle();

  return {
    data: editable.data,
    visibility: editable.visibility,
    slug: editable.slug,
    userId: editable.userId,
    step: (p?.onboarding_step as number) ?? 0,
    completed: Boolean(p?.onboarding_completed_at),
    status: (p?.status as string) ?? null,
  };
}

export interface OnboardingState {
  data: OnboardingData;
  step: number;
  completed: boolean;
  slug: string | null;
  status: string | null;
}

// Loads the signed-in member's profile into the onboarding shape so the wizard
// can resume where they left off. Returns null when unconfigured or signed out.
export async function loadOnboarding(): Promise<OnboardingState | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const user = await getSessionUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `slug, full_name, role_title, industry, city, positioning, known_for, about,
       status, onboarding_step, onboarding_completed_at,
       businesses ( name, description, website, founded_year, team_size ),
       expertise ( label, sort_order )`,
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { data: { ...emptyOnboarding }, step: 0, completed: false, slug: null, status: null };
  }

  const business = Array.isArray(profile.businesses)
    ? profile.businesses[0]
    : profile.businesses;

  const expertise = (profile.expertise ?? [])
    .slice()
    .sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order,
    )
    .map((e: { label: string }) => e.label);

  return {
    data: {
      fullName: profile.full_name ?? "",
      roleTitle: profile.role_title ?? "",
      industry: profile.industry ?? "",
      city: profile.city ?? "",
      positioning: profile.positioning ?? "",
      knownFor: profile.known_for ?? "",
      about: profile.about ?? "",
      expertise,
      business: {
        name: business?.name ?? "",
        description: business?.description ?? "",
        website: business?.website ?? "",
        foundedYear: business?.founded_year ? String(business.founded_year) : "",
        teamSize: business?.team_size ?? "",
      },
    },
    step: profile.onboarding_step ?? 0,
    completed: Boolean(profile.onboarding_completed_at),
    slug: profile.slug ?? null,
    status: (profile.status as string) ?? null,
  };
}

// Where to send a user after auth: an unmet MFA challenge → /mfa; pending
// approval → /pending; otherwise onboarding until done, then the Tribe home.
export async function getPostAuthRedirect(): Promise<string> {
  const supabase = await createClient();
  if (supabase) {
    try {
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        return "/mfa";
      }
    } catch {
      // Fail open — never block sign-in on an MFA lookup error.
    }
  }

  const state = await loadOnboarding();
  if (!state) return "/home";
  if (state.status === "pending") return "/pending";
  return state.completed ? "/home" : "/onboarding";
}
