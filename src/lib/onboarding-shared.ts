// Client-safe onboarding types + completion math (no server imports).

export interface OnboardingBusiness {
  name: string;
  description: string;
  website: string;
  foundedYear: string; // kept as string for the input; parsed on save
  teamSize: string;
}

export interface OnboardingData {
  fullName: string;
  roleTitle: string;
  industry: string;
  city: string;
  positioning: string;
  knownFor: string;
  about: string;
  expertise: string[];
  business: OnboardingBusiness;
}

export const emptyOnboarding: OnboardingData = {
  fullName: "",
  roleTitle: "",
  industry: "",
  city: "",
  positioning: "",
  knownFor: "",
  about: "",
  expertise: [],
  business: { name: "", description: "", website: "", foundedYear: "", teamSize: "" },
};

// Weighted fields that make a feature feel "complete". Drives the progress meter.
const COMPLETION_CHECKS: ((d: OnboardingData) => boolean)[] = [
  (d) => d.fullName.trim().length > 0,
  (d) => d.roleTitle.trim().length > 0,
  (d) => d.industry.trim().length > 0,
  (d) => d.city.trim().length > 0,
  (d) => d.positioning.trim().length > 0,
  (d) => d.knownFor.trim().length > 0,
  (d) => d.about.trim().length > 0,
  (d) => d.expertise.length > 0,
  (d) => d.business.name.trim().length > 0,
];

export function computeCompletion(d: OnboardingData): number {
  const passed = COMPLETION_CHECKS.filter((check) => check(d)).length;
  return Math.round((passed / COMPLETION_CHECKS.length) * 100);
}
