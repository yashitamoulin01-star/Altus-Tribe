// Client-safe app-settings metadata — NO "server-only", so both the admin editor
// (client) and the server data layer can import it. The single source of truth
// for canonical setting keys, their group, input kind, and whether they're public
// (member-readable). Mirrors the seed in migration 0024 — keep the two in sync.

export type SettingKind = "url" | "video" | "text";

export interface SettingDef {
  key: string;
  label: string;
  group: string;
  kind: SettingKind;
  public: boolean;
  placeholder?: string;
}

export const SETTING_GROUPS = ["Featured Content", "Social Channels", "Campus & Community"] as const;

export const SETTINGS: SettingDef[] = [
  { key: "featured_video_title", label: "Featured video title", group: "Featured Content", kind: "text", public: true, placeholder: "The Productivity Operating System" },
  { key: "featured_video_url", label: "Featured video (YouTube URL)", group: "Featured Content", kind: "video", public: true, placeholder: "https://youtube.com/watch?v=…" },
  { key: "social_youtube", label: "YouTube channel", group: "Social Channels", kind: "url", public: true, placeholder: "https://youtube.com/@altus" },
  { key: "social_instagram", label: "Instagram", group: "Social Channels", kind: "url", public: true, placeholder: "https://instagram.com/…" },
  { key: "social_facebook", label: "Facebook group", group: "Social Channels", kind: "url", public: true, placeholder: "https://facebook.com/groups/…" },
  { key: "social_linkedin", label: "LinkedIn", group: "Social Channels", kind: "url", public: true, placeholder: "https://linkedin.com/company/…" },
  { key: "social_x", label: "X / Twitter", group: "Social Channels", kind: "url", public: true, placeholder: "https://x.com/…" },
  { key: "ps_orientation_url", label: "PS Orientation invite link", group: "Campus & Community", kind: "url", public: true, placeholder: "https://…" },
  { key: "ps_app_url", label: "Productivity Shastra app link", group: "Campus & Community", kind: "url", public: true, placeholder: "https://app.productivityshastra.com/dashboard" },
  { key: "manan_whatsapp_number", label: "Manan Vasa WhatsApp number (E.164, no +)", group: "Campus & Community", kind: "text", public: true, placeholder: "918097010410" },
  { key: "manan_whatsapp_prefill", label: "Manan WhatsApp prefill message", group: "Campus & Community", kind: "text", public: true, placeholder: "Hi Manan, regarding Altus Tribe…" },
];

// Altus Tribe is part of the Productivity Shastra ecosystem. Stable default so the
// ecosystem entry point works out of the box; admins can override via settings.
export const PS_APP_URL = "https://app.productivityshastra.com/dashboard";

// Manan Vasa WhatsApp (already in use via Sacred Space AskManan). Admin-overridable
// via the manan_whatsapp_number setting; this constant is the verified fallback.
export const MANAN_WHATSAPP_NUMBER = "918097010410"; // +91 80970 10410 (E.164, no +)
export const MANAN_WHATSAPP_PREFILL = "Hi Manan, this is regarding Altus Tribe.";

export const SETTING_KEYS = SETTINGS.map((s) => s.key);
export const SETTING_MAP: Record<string, SettingDef> = Object.fromEntries(
  SETTINGS.map((s) => [s.key, s]),
);
