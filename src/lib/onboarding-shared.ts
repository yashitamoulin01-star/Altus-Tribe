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
