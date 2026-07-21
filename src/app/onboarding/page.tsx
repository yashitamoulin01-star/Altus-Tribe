import { redirect } from "next/navigation";
import { loadOnboardingFull } from "@/lib/onboarding";
import { getTaxonomies } from "@/lib/profile-edit";
import { isAuthConfigured } from "@/lib/auth";
import { emptyEditable } from "@/lib/profile-fields";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = { title: "Build your identity — Altus Tribe" };

export default async function OnboardingPage() {
  const configured = isAuthConfigured();
  const [state, taxonomies] = await Promise.all([
    loadOnboardingFull(),
    getTaxonomies(),
  ]);

  // Already finished? Send them into the app.
  if (state?.completed) redirect("/home");

  return (
    <OnboardingWizard
      initial={state?.data ?? emptyEditable}
      initialVisibility={state?.visibility ?? {}}
      initialStep={state?.step ?? 0}
      slug={state?.slug ?? null}
      userId={state?.userId ?? null}
      industries={taxonomies.industry}
      categories={taxonomies.category}
      configured={configured}
    />
  );
}
