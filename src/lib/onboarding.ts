import "server-only";
import { createClient } from "@/lib/supabase/server";
import { emptyOnboarding, type OnboardingData } from "@/lib/onboarding-shared";

export interface OnboardingState {
  data: OnboardingData;
  step: number;
  completed: boolean;
  slug: string | null;
}

// Loads the signed-in member's profile into the onboarding shape so the wizard
// can resume where they left off. Returns null when unconfigured or signed out.
export async function loadOnboarding(): Promise<OnboardingState | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `slug, full_name, role_title, industry, city, positioning, known_for, about,
       onboarding_step, onboarding_completed_at,
       businesses ( name, description, website, founded_year, team_size ),
       expertise ( label, sort_order )`,
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { data: { ...emptyOnboarding }, step: 0, completed: false, slug: null };
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
  };
}

// Where to send a user after auth: onboarding until done, then account.
export async function getPostAuthRedirect(): Promise<string> {
  const state = await loadOnboarding();
  if (!state) return "/account";
  return state.completed ? "/account" : "/onboarding";
}
