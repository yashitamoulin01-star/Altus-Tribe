// Client-safe CRM field metadata — NO "server-only" import, so both the server
// data layer (lib/crm.ts) and the client editor (admin CrmEditor) can use it.
// The A3–A9 + A21 asset slots; `text`/`link`/`image` flag which inputs to render.

export const CRM_ASSET_FIELDS: {
  kind: string;
  label: string;
  text?: boolean;
  link?: boolean;
  image?: boolean;
}[] = [
  { kind: "linkedin_rec", label: "LinkedIn Recommendation (A3)", text: true, image: true },
  { kind: "google_review", label: "Google Review (A4)", text: true, image: true },
  { kind: "raw_video", label: "Raw Video (A5)", link: true },
  { kind: "interview_video", label: "Interview Video (A6)", link: true },
  { kind: "long_video", label: "Long Video (A7)", link: true },
  { kind: "shorts_video", label: "YouTube Shorts (A8)", link: true },
  { kind: "ig_case_study", label: "Instagram Case Study (A9)", link: true },
  { kind: "case_study", label: "Case Study (A21)", link: true },
];
