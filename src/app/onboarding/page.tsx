import { redirect } from "next/navigation";
import { loadOnboarding } from "@/lib/onboarding";
import { isAuthConfigured } from "@/lib/auth";
import { emptyOnboarding } from "@/lib/onboarding-shared";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = { title: "Build your feature — Altus Tribe" };

export default async function OnboardingPage() {
  const configured = isAuthConfigured();
  const state = await loadOnboarding();

  // Already finished? Send them to their account.
  if (state?.completed) redirect("/account");

  return (
    <OnboardingWizard
      initial={state?.data ?? emptyOnboarding}
      initialStep={state?.step ?? 0}
      slug={state?.slug ?? null}
      configured={configured}
    />
  );
}
