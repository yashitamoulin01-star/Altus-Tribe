"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveProfile } from "@/app/(app)/account/edit/actions";
import { finishOnboarding } from "./actions";
import { uploadFile } from "@/lib/storage-client";
import { lookupPincode } from "@/lib/pincode";
import { isValidPhone } from "@/lib/phone";
import PhoneField from "@/components/PhoneField";
import ChipInput from "@/components/ChipInput";
import BestTimePicker from "@/components/BestTimePicker";
import LegalModal, { type LegalDocType } from "@/components/LegalModal";
import {
  ATTACHMENT_KIND_LABELS,
  composeFullName,
  computeProfileCompletion,
  CONNECT_MODES,
  isFieldVisible,
  isFileKind,
  MAX_ATTACHMENTS,
  requiredSetupMissing,
  factoryAddressMissing,
  validateField,
  VISIBILITY_FIELDS,
  type AttachmentKind,
  type EditableAddress,
  type EditableAttachment,
  type EditableProfile,
  type FieldVisibility,
} from "@/lib/profile-fields";

// ---------------------------------------------------------------------------
// UI-4: Production-level Onboarding Wizard
// 13-screen conversational portfolio builder.  All 48 PRD fields preserved.
// Light-mode-first, Altus Tribe design system, professional SVG icons only.
// ---------------------------------------------------------------------------

const SCREENS = [
  "Welcome",
  "Personal",
  "Business",
  "Contact",
  "Business address",
  "Home address",
  "Factory address",
  "Portfolio",
  "Networking",
  "Community",
  "Privacy",
  "Review",
  "Done",
] as const;

const FIRST_CONTENT = 1;
const LAST_CONTENT = 11;
const COMPLETION = 12;

const MARITAL = ["Single", "Dating", "Married", "Separated", "Divorced", "Widowed", "Confidential"];
const BLOOD = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const YES_NO_MAYBE = ["Yes", "No", "Maybe"];
const NETWORK_PREF = ["Online", "Physically", "Both", "No"];
const TOOLS = [
  "Time Auditer", "Power Planner", "Reasons Eliminator", "Time Finder",
  "TFCR Model", "MIH Framework", "Performance Builder", "Habits Enhancer",
  "Meeting Success Maximizer", "Communication Manager", "Sales Cultivator",
  "Productivity Calculator",
];

// ─── Design tokens (scoped to class strings) ───────────────────────────────
const cls = {
  input:
    "w-full rounded-xl border border-hairline bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink-muted transition-colors focus:border-red/40 focus:outline-none focus:ring-4 focus:ring-red/8 dark:bg-surface-sunk dark:focus:bg-surface",
  area:
    "w-full rounded-xl border border-hairline bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink-muted transition-colors focus:border-red/40 focus:outline-none focus:ring-4 focus:ring-red/8 leading-relaxed resize-y min-h-[108px] dark:bg-surface-sunk",
  label:
    "block text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted mb-1.5",
  fieldWrap: "space-y-1.5",
  chip: "inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1 text-[13px] text-ink",
  segBtn: (on: boolean) =>
    `rounded-xl border px-3.5 py-2 text-[13px] font-medium transition-all select-none cursor-pointer ${
      on
        ? "border-red/30 bg-red/8 text-red shadow-sm"
        : "border-hairline bg-white text-ink-muted hover:border-hairline-bright hover:text-ink dark:bg-surface"
    }`,
  privacyToggle: (on: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer select-none ${
      on ? "text-ink bg-surface border border-hairline" : "text-ink-muted"
    }`,
};

// ─── SVG icon set (inline, no emoji, consistent 20px stroke-based) ──────────
const Icon = {
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  building: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
    </svg>
  ),
  phone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.6 10.8a15.5 15.5 0 006.6 6.6l2.2-2.2a1 1 0 011.1-.2 11.5 11.5 0 003.6 1.1 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3a1 1 0 011 1 11.5 11.5 0 001.1 3.6 1 1 0 01-.2 1.1L6.6 10.8z"/>
    </svg>
  ),
  mapPin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
    </svg>
  ),
  briefcase: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  ),
  network: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
      <path d="M12 7v4M5 17l7-6M19 17l-7-6"/>
    </svg>
  ),
  heart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  eye: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  eyeOff: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  link: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  arrowRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  arrowLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  linkedin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/>
      <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
    </svg>
  ),
  github: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
    </svg>
  ),
  instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  youtube: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
    </svg>
  ),
  telegram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  whatsapp: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
    </svg>
  ),
  globe: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  ),
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
};

// Screen metadata for step headers
const STEP_META: Record<number, { icon: React.ReactNode; title: string; sub: string }> = {
  1: { icon: Icon.user,      title: "Tell us about yourself",       sub: "The human behind the business." },
  2: { icon: Icon.building,  title: "Your business identity",       sub: "How the Tribe will recognise your work." },
  3: { icon: Icon.phone,     title: "How to reach you",             sub: "Members connect through these channels." },
  4: { icon: Icon.mapPin,    title: "Business address",             sub: "Where your work happens." },
  5: { icon: Icon.mapPin,    title: "Home address",                 sub: "Optional — kept private unless you choose to share it." },
  6: { icon: Icon.mapPin,    title: "Factory / warehouse address",  sub: "Optional — add only if separate from your office." },
  7: { icon: Icon.briefcase, title: "Your showcase",                sub: "Brochures, videos, and your connect channels." },
  8: { icon: Icon.network,   title: "How you network",              sub: "Help the Tribe make the right introductions." },
  9: { icon: Icon.heart,     title: "Your Altus journey",           sub: "Your programme batches and how you contribute." },
  10: { icon: Icon.shield,   title: "Privacy preferences",          sub: "Choose who sees your profile and which fields are visible." },
  11: { icon: Icon.check,    title: "Review your identity",         sub: "A quick look before you go live. Edit any section." },
};

// ─── Privacy eye toggle ─────────────────────────────────────────────────────
function EyeBtn({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label={on ? `Hide ${label} on profile` : `Show ${label} on profile`}
      className={cls.privacyToggle(on)}
      title={on ? "Visible on profile — click to hide" : "Hidden — click to show"}
    >
      <span aria-hidden="true">{on ? Icon.eye : Icon.eyeOff}</span>
      <span>{on ? "Shown" : "Hidden"}</span>
    </button>
  );
}

// ─── Field wrapper ──────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  error,
  required,
  eyeKey,
  vis,
  onToggleVis,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  eyeKey?: string;
  vis?: FieldVisibility;
  onToggleVis?: (k: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={cls.fieldWrap}>
      <div className="flex items-center justify-between gap-2">
        <label className={cls.label}>
          {label}
          {required && <span className="ml-1 text-red" aria-hidden="true">*</span>}
        </label>
        {eyeKey && vis && onToggleVis && (
          <EyeBtn
            on={isFieldVisible(vis, eyeKey)}
            onToggle={() => onToggleVis(eyeKey)}
            label={label}
          />
        )}
      </div>
      {children}
      {hint && !error && (
        <p className="text-[12px] text-ink-muted leading-relaxed">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-[12px] text-red flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm0 9a1.25 1.25 0 110 2.5A1.25 1.25 0 0112 16z"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Chip segmented control ─────────────────────────────────────────────────
function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(value === o ? "" : o)}
          aria-pressed={value === o}
          className={cls.segBtn(value === o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// ─── Pincode-auto address block ─────────────────────────────────────────────
function AddressFields({
  value,
  onChange,
}: {
  value: EditableAddress;
  onChange: (k: keyof EditableAddress, v: string) => void;
}) {
  const [looking, setLooking] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const onPincode = async (raw: string) => {
    const pin = raw.replace(/[^0-9]/g, "").slice(0, 6);
    onChange("pincode", pin);
    setHint(null);
    if (pin.length !== 6) return;
    setLooking(true);
    const r = await lookupPincode(pin);
    setLooking(false);
    if (!r) {
      setHint("Could not look that up — please fill city / state / country manually.");
      return;
    }
    if (!value.city.trim()) onChange("city", r.city);
    if (!value.state.trim()) onChange("state", r.state);
    if (!value.country.trim()) onChange("country", r.country);
    setHint("Suggested from your PIN code — edit if needed.");
  };

  return (
    <div className="space-y-3">
      <input className={cls.input} placeholder="Line 1 — Unit / Floor / Plot" value={value.line1} onChange={(e) => onChange("line1", e.target.value)} />
      <input className={cls.input} placeholder="Line 2 — Building / Unit name" value={value.line2} onChange={(e) => onChange("line2", e.target.value)} />
      <input className={cls.input} placeholder="Line 3 — Street / Road" value={value.line3} onChange={(e) => onChange("line3", e.target.value)} />
      <input className={cls.input} placeholder="Line 4 — Area / Sector" value={value.line4} onChange={(e) => onChange("line4", e.target.value)} />
      <input className={cls.input} placeholder="Nearby landmark (optional)" value={value.landmark} onChange={(e) => onChange("landmark", e.target.value)} />
      <div>
        <input
          className={cls.input}
          inputMode="numeric"
          placeholder="PIN / Postal code"
          value={value.pincode}
          onChange={(e) => onPincode(e.target.value)}
        />
        {(looking || hint) && (
          <p className="mt-1 text-[12px] text-ink-muted">{looking ? "Looking up…" : hint}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input className={cls.input} placeholder="City" value={value.city} onChange={(e) => onChange("city", e.target.value)} />
        <input className={cls.input} placeholder="State" value={value.state} onChange={(e) => onChange("state", e.target.value)} />
        <input className={cls.input} placeholder="Country" value={value.country} onChange={(e) => onChange("country", e.target.value)} />
      </div>
      <input className={cls.input} placeholder="Google Maps link (optional)" value={value.mapLink} onChange={(e) => onChange("mapLink", e.target.value)} />
    </div>
  );
}

// ─── Image picker ───────────────────────────────────────────────────────────
function ImagePicker({
  label,
  value,
  configured,
  aspect,
  onUrl,
  onFile,
  required,
}: {
  label: string;
  value: string;
  configured: boolean;
  aspect: string;
  onUrl: (v: string) => void;
  onFile: (f: File) => Promise<void>;
  required?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    setBusy(true);
    try { await onFile(f); }
    catch (e) { setErr(e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <span className={cls.label}>
        {label}
        {required && <span className="ml-1 text-red" aria-hidden="true">*</span>}
      </span>
      <div className="mt-1.5 flex items-start gap-4">
        <div className={`${aspect} w-20 shrink-0 overflow-hidden rounded-xl border border-hairline bg-surface-sunk`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-ink-muted">
              <span>{Icon.upload}</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2 pt-1">
          {configured ? (
            <>
              <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              <button
                type="button"
                onClick={() => ref.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-white px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-hairline-bright hover:bg-surface-hover disabled:opacity-60"
              >
                <span aria-hidden="true">{Icon.upload}</span>
                {busy ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
              </button>
              {value && (
                <button type="button" onClick={() => onUrl("")} className="ml-2 text-[13px] text-ink-muted underline transition-colors hover:text-red">
                  Remove
                </button>
              )}
              {err && <p className="text-[12px] text-red">{err}</p>}
            </>
          ) : (
            <input className={cls.input} placeholder="https://…/image.jpg" value={value} onChange={(e) => onUrl(e.target.value)} />
          )}
          <p className="text-[12px] text-ink-muted">JPG or PNG. Max 5 MB.</p>
        </div>
      </div>
    </div>
  );
}

// ─── File attachment picker ─────────────────────────────────────────────────
function AttachmentFile({
  filePath,
  configured,
  onFile,
  onPath,
  onClear,
}: {
  filePath: string;
  configured: boolean;
  onFile: (f: File) => Promise<void>;
  onPath: (v: string) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    setBusy(true);
    try { await onFile(f); }
    catch (e) { setErr(e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(false); }
  };

  if (!configured) {
    return <input className={cls.input} placeholder="Storage path or URL" value={filePath} onChange={(e) => onPath(e.target.value)} />;
  }

  return (
    <div className="space-y-1.5">
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-white px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-hairline-bright disabled:opacity-60"
        >
          <span aria-hidden="true">{Icon.upload}</span>
          {busy ? "Uploading…" : filePath ? "Replace file" : "Upload file"}
        </button>
        {filePath && (
          <button type="button" onClick={onClear} className="text-[13px] text-ink-muted transition-colors hover:text-red">
            Remove
          </button>
        )}
      </div>
      {filePath && <p className="truncate text-[12px] text-ink-muted">Uploaded: {filePath.split("/").pop()}</p>}
      {err && <p className="text-[12px] text-red">{err}</p>}
    </div>
  );
}

// ─── Social link row ────────────────────────────────────────────────────────
function SocialRow({
  icon,
  label,
  value,
  onChange,
  placeholder,
  eyeKey,
  vis,
  onToggleVis,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  eyeKey?: string;
  vis?: FieldVisibility;
  onToggleVis?: (k: string) => void;
}) {
  return (
    <Field label={label} eyeKey={eyeKey} vis={vis} onToggleVis={onToggleVis}>
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-hairline bg-surface-sunk text-ink-muted">
          {icon}
        </span>
        <input
          className={cls.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </Field>
  );
}

// ─── Review group ───────────────────────────────────────────────────────────
function ReviewGroup({
  title,
  onEdit,
  rows,
}: {
  title: string;
  onEdit: () => void;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{title}</p>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg px-3 py-1 text-[13px] font-medium text-red transition-colors hover:bg-red/8"
        >
          Edit
        </button>
      </div>
      <dl className="divide-y divide-hairline">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2 text-[14px]">
            <dt className="shrink-0 text-ink-muted">{k}</dt>
            <dd className="truncate text-right font-medium text-ink">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ─── Screen shell ───────────────────────────────────────────────────────────
function ScreenShell({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) {
  const meta = STEP_META[step];
  if (!meta) return <>{children}</>;

  return (
    <div>
      <div className="mb-7 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red text-white shadow-sm shadow-red/30">
          {meta.icon}
        </div>
        <div>
          <h1 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-ink sm:text-[26px]">
            {meta.title}
          </h1>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-secondary">{meta.sub}</p>
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

// ─── Completion screen ──────────────────────────────────────────────────────
function CompletionStep({
  fullName,
  slug,
  configured,
  onEnter,
  finishing,
}: {
  fullName: string;
  slug: string | null;
  configured: boolean;
  onEnter: () => void;
  finishing: boolean;
}) {
  useEffect(() => { onEnter(); }, [onEnter]);

  return (
    <div className="flex flex-col items-center py-16 text-center space-y-8">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-red/10 border-2 border-red/20">
        <span className="text-red scale-110">{Icon.check}</span>
        <span className="absolute inset-0 animate-ping rounded-full bg-red/10" />
      </div>

      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink sm:text-[32px]">
          You&apos;re in, {fullName ? fullName.split(" ")[0] : ""}
        </h1>
        <p className="mt-3 max-w-[36ch] mx-auto text-[15px] leading-relaxed text-ink-secondary">
          Your networking identity is live. Redirecting you to the Altus Tribe dashboard now.
        </p>
      </div>

      <div className="w-full max-w-xs rounded-2xl border border-hairline bg-white p-5 shadow-sm">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-muted mb-3">
          Entering the Tribe
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
          <div className="h-full w-full animate-pulse rounded-full bg-red" />
        </div>
      </div>

      <button
        type="button"
        onClick={onEnter}
        disabled={finishing}
        className="inline-flex items-center gap-2 rounded-xl bg-red px-8 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover active:scale-95 disabled:opacity-60"
      >
        {finishing ? "Redirecting…" : "Go to Dashboard"}
        <span aria-hidden="true">{Icon.arrowRight}</span>
      </button>

      {slug && configured && (
        <a
          href="/home"
          className="text-[13px] text-ink-muted underline transition-colors hover:text-ink"
        >
          Go to main page
        </a>
      )}
    </div>
  );
}

// ─── Truncate for review ────────────────────────────────────────────────────
function trunc(s: string, n = 60) {
  const t = s.trim();
  if (!t) return "—";
  return t.length > n ? t.slice(0, n) + "…" : t;
}

// ─── SocialLinksManager (exported for EditFeature reuse) ────────────────────
export function SocialLinksManager({
  d,
  set,
  vis,
  onToggleVis,
}: {
  d: EditableProfile;
  set: <K extends keyof EditableProfile>(k: K, v: EditableProfile[K]) => void;
  vis?: FieldVisibility;
  onToggleVis?: (k: string) => void;
}) {
  // UI-4: one clean inline grid — no prompt()-based "Quick Connect" (removed;
  // it was a strictly-worse duplicate of these inline fields).
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <SocialRow icon={Icon.linkedin}  label="LinkedIn"                value={d.linkedin}          onChange={(v) => set("linkedin", v)}          placeholder="linkedin.com/in/username"     eyeKey="linkedin"          vis={vis} onToggleVis={onToggleVis} />
      <SocialRow icon={Icon.github}    label="GitHub"                  value={d.github}            onChange={(v) => set("github", v)}            placeholder="github.com/username" />
      <SocialRow icon={Icon.whatsapp}  label="WhatsApp number or link" value={d.whatsappLink}      onChange={(v) => set("whatsappLink", v)}      placeholder="wa.me/919999999999"           eyeKey="whatsapp"          vis={vis} onToggleVis={onToggleVis} />
      <SocialRow icon={Icon.mail}      label="Work email"              value={d.workEmail}         onChange={(v) => set("workEmail", v)}         placeholder="you@company.com"             eyeKey="work_email"        vis={vis} onToggleVis={onToggleVis} />
      <SocialRow icon={Icon.telegram}  label="Telegram handle or link" value={d.telegram}          onChange={(v) => set("telegram", v)}          placeholder="t.me/username" />
      <SocialRow icon={Icon.instagram} label="Business Instagram"      value={d.businessInstagram} onChange={(v) => set("businessInstagram", v)} placeholder="instagram.com/brand"          eyeKey="business_instagram" vis={vis} onToggleVis={onToggleVis} />
      <SocialRow icon={Icon.youtube}   label="YouTube channel"         value={d.youtube}           onChange={(v) => set("youtube", v)}           placeholder="youtube.com/@channel" />
      <SocialRow icon={Icon.globe}     label="Other / portfolio link"  value={d.customLink}        onChange={(v) => set("customLink", v)}        placeholder="yoursite.com" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function OnboardingWizard({
  initial,
  initialVisibility,
  initialStep,
  slug,
  userId,
  industries,
  categories,
  configured,
}: {
  initial: EditableProfile;
  initialVisibility: FieldVisibility;
  initialStep: number;
  slug: string | null;
  userId: string | null;
  industries: string[];
  categories: string[];
  configured: boolean;
}) {
  const [d, setD] = useState<EditableProfile>(initial);
  const [vis, setVis] = useState<FieldVisibility>(initialVisibility);
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), COMPLETION));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [finishing, startFinish] = useTransition();
  const [certifyAccurate, setCertifyAccurate] = useState(false);
  const [understandDisplay, setUnderstandDisplay] = useState(false);
  const [agreeDeclaration, setAgreeDeclaration] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);
  const [homeMode, setHomeMode] = useState<"enter" | "same" | "none">("enter");

  const firstRender = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced autosave
  useEffect(() => {
    if (!configured || step < FIRST_CONTENT || step > LAST_CONTENT) return;
    if (firstRender.current) { firstRender.current = false; return; }
    setSaveState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveProfile(d, vis, undefined, step)
        .then((r) => setSaveState(r.ok ? "saved" : "error"))
        .catch(() => setSaveState("error"));
    }, 900);
    return () => clearTimeout(timer.current);
  }, [d, vis, step, configured]);

  const completion = computeProfileCompletion(d);
  const factoryMissing = factoryAddressMissing(d.factoryAddress);
  const missingRequired = [...requiredSetupMissing(d), ...factoryMissing.map((f) => `Factory address — ${f}`)];
  const canFinish = missingRequired.length === 0;

  const set = <K extends keyof EditableProfile>(k: K, v: EditableProfile[K]) => {
    setD((p) => ({ ...p, [k]: v }));
    setSaveState("idle");
  };
  const setAddr = (which: "workAddress" | "homeAddress" | "factoryAddress", k: keyof EditableAddress, v: string) =>
    setD((p) => ({ ...p, [which]: { ...p[which], [k]: v } }));
  const copyFromWork = (which: "homeAddress" | "factoryAddress") =>
    setD((p) => ({ ...p, [which]: { ...p.workAddress } }));
  const toggleVis = (key: string) =>
    setVis((v) => ({ ...v, [key]: !isFieldVisible(v, key) }));
  const toggleMode = (m: string) =>
    set("bestModes", d.bestModes.includes(m) ? d.bestModes.filter((x) => x !== m) : [...d.bestModes, m]);

  const tools = d.favouriteTools ? d.favouriteTools.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const toggleTool = (t: string) => {
    const has = tools.includes(t);
    const next = has ? tools.filter((x) => x !== t) : tools.length < 3 ? [...tools, t] : tools;
    set("favouriteTools", next.join(", "));
  };

  const uploadImage = async (field: "photoUrl" | "companyLogoUrl", file: File) => {
    if (!userId) throw new Error("Not signed in.");
    const r = await uploadFile("member-photos", userId, file);
    if (!r.ok) throw new Error(r.error);
    set(field, r.publicUrl ?? "");
  };

  const addAttachment = () => {
    if (d.attachments.length >= MAX_ATTACHMENTS) return;
    set("attachments", [...d.attachments, { kind: "brochure", title: "", url: "", filePath: "" }]);
  };
  const patchAttachment = (i: number, patch: Partial<EditableAttachment>) =>
    set("attachments", d.attachments.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const removeAttachment = (i: number) =>
    set("attachments", d.attachments.filter((_, idx) => idx !== i));
  const uploadAttachment = async (i: number, file: File) => {
    if (!userId) throw new Error("Not signed in.");
    const r = await uploadFile("work-files", userId, file);
    if (!r.ok) throw new Error(r.error);
    patchAttachment(i, { filePath: r.path });
  };

  const next = () => setStep((s) => Math.min(s + 1, COMPLETION));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const goto = (s: number) => setStep(s);

  const submit = () =>
    startFinish(async () => {
      if (configured) await saveProfile(d, vis, undefined, COMPLETION);
      setStep(COMPLETION);
    });
  const enter = () => startFinish(async () => finishOnboarding());

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-paper">
      {/* Progress bar (steps 1–11) */}
      {step >= FIRST_CONTENT && step <= LAST_CONTENT && (
        <div className="sticky top-0 z-40 border-b border-hairline bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-[640px] items-center justify-between px-5 py-3 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="hidden text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted sm:block">
                Step {step} of {LAST_CONTENT}
              </span>
              <span className="rounded-full bg-red/10 px-2.5 py-0.5 text-[12px] font-semibold text-red">
                {SCREENS[step]}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-[12px] text-ink-muted sm:block">
                {!configured
                  ? "Preview mode"
                  : saveState === "saving"
                    ? "Saving…"
                    : saveState === "saved"
                      ? "Saved"
                      : saveState === "error"
                        ? "Save failed"
                        : ""}
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-ink-muted">
                {completion}%
              </span>
            </div>
          </div>
          <div className="h-0.5 w-full bg-surface-sunk">
            <div
              className="h-full bg-red transition-[width] duration-500 ease-out"
              style={{ width: `${((step - FIRST_CONTENT) / (LAST_CONTENT - FIRST_CONTENT)) * 100}%` }}
            />
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[640px] flex-1 px-5 py-10 sm:px-8 sm:py-14">

        {/* ── Step 0: Welcome ────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="py-8 reveal">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red text-white shadow-lg shadow-red/30">
              {Icon.network}
            </div>
            <p className="kicker mb-3">Welcome to Altus Tribe</p>
            <h1 className="t-display text-ink">
              Let&apos;s build your networking identity.
            </h1>
            <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-ink-secondary">
              Walk through your profile together — personal, business, contact, portfolio and networking.
              About 5&nbsp;minutes. Every answer saves automatically, so you can pause and resume anytime.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red px-7 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover active:scale-95"
              >
                {initialStep > FIRST_CONTENT ? "Resume where I left off" : "Start building my identity"}
                <span aria-hidden="true">{Icon.arrowRight}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Personal ──────────────────────────────────────────── */}
        {step === 1 && (
          <ScreenShell step={1}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="First name" required>
                <input className={cls.input} value={d.firstName} onChange={(e) => set("firstName", e.target.value.toUpperCase())} placeholder="PRIYA" autoComplete="given-name" />
              </Field>
              <Field label="Middle name">
                <input className={cls.input} value={d.middleName} onChange={(e) => set("middleName", e.target.value.toUpperCase())} />
              </Field>
              <Field label="Last name" required>
                <input className={cls.input} value={d.lastName} onChange={(e) => set("lastName", e.target.value.toUpperCase())} placeholder="SHAH" autoComplete="family-name" />
              </Field>
            </div>

            <ImagePicker
              label="Profile photo"
              required
              value={d.photoUrl}
              configured={configured}
              aspect="aspect-[4/5]"
              onUrl={(v) => set("photoUrl", v)}
              onFile={(f) => uploadImage("photoUrl", f)}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Birth date" required eyeKey="birth_date" vis={vis} onToggleVis={toggleVis}>
                <input type="date" className={cls.input} value={d.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
              </Field>
              <Field label="Blood group" required eyeKey="blood_group" vis={vis} onToggleVis={toggleVis}>
                <select className={cls.input} value={d.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
                  <option value="">Select</option>
                  {BLOOD.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Marital status" eyeKey="marital_status" vis={vis} onToggleVis={toggleVis}>
              <div className="mt-1">
                <Segmented value={d.maritalStatus} options={MARITAL} onChange={(v) => set("maritalStatus", v)} />
              </div>
            </Field>

            <Field label="Marriage anniversary" eyeKey="anniversary" vis={vis} onToggleVis={toggleVis}>
              <input type="date" className={cls.input} value={d.anniversary} onChange={(e) => set("anniversary", e.target.value)} />
            </Field>

            <Field label="Biography" hint="What you left, what you're building, and why it matters.">
              <textarea className={cls.area} value={d.about} onChange={(e) => set("about", e.target.value)} placeholder="Share your story…" />
            </Field>
          </ScreenShell>
        )}

        {/* ── Step 2: Business ──────────────────────────────────────────── */}
        {step === 2 && (
          <ScreenShell step={2}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="sm:w-36">
                <ImagePicker
                  label="Company logo"
                  value={d.companyLogoUrl}
                  configured={configured}
                  aspect="aspect-square"
                  onUrl={(v) => set("companyLogoUrl", v)}
                  onFile={(f) => uploadImage("companyLogoUrl", f)}
                />
              </div>
              <div className="flex-1 space-y-4">
                <Field label="Business name" required>
                  <input className={cls.input} value={d.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Greentech Solutions" />
                </Field>
                <Field label="Brand names" required hint="Comma-separated if you operate more than one brand.">
                  <input className={cls.input} value={d.brandNames} onChange={(e) => set("brandNames", e.target.value)} placeholder="GreenWrap, EcoBox" />
                </Field>
              </div>
            </div>

            <Field label="Company website" error={validateField("companyWebsite", d.companyWebsite)}>
              <div className="flex items-center gap-2">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-hairline bg-surface-sunk text-ink-muted">{Icon.globe}</span>
                <input className={cls.input} value={d.companyWebsite} onChange={(e) => set("companyWebsite", e.target.value)} placeholder="www.example.com" />
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Business category" required>
                <select className={cls.input} value={d.category} onChange={(e) => set("category", e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Industry / sector" required>
                <select className={cls.input} value={d.industry} onChange={(e) => set("industry", e.target.value)}>
                  <option value="">Select industry</option>
                  {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Nature of business" hint="Products / services / solutions — what you offer.">
              <textarea className={cls.area} value={d.natureOfBusiness} onChange={(e) => set("natureOfBusiness", e.target.value)} placeholder="We manufacture and distribute sustainable packaging…" />
            </Field>

            <Field label="Your biggest USP" hint="Why should people come to you specifically?">
              <textarea className={cls.area} value={d.usp} onChange={(e) => set("usp", e.target.value)} placeholder="We guarantee 48-hour delivery across India with zero single-use plastic…" />
            </Field>
          </ScreenShell>
        )}

        {/* ── Step 3: Contact ───────────────────────────────────────────── */}
        {step === 3 && (
          <ScreenShell step={3}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label="Mobile number"
                required
                eyeKey="cell_no"
                vis={vis}
                onToggleVis={toggleVis}
                error={d.cellNo && !isValidPhone(d.cellNo) ? "Enter a valid mobile number." : null}
              >
                <PhoneField value={d.cellNo} onChange={(v) => set("cellNo", v)} autoComplete="tel" />
              </Field>

              <Field
                label="Alternate number"
                required
                eyeKey="alt_no"
                vis={vis}
                onToggleVis={toggleVis}
                error={d.altNo && !isValidPhone(d.altNo) ? "Enter a valid mobile number." : null}
              >
                <PhoneField value={d.altNo} onChange={(v) => set("altNo", v)} />
              </Field>

              <Field
                label="WhatsApp number"
                eyeKey="whatsapp"
                vis={vis}
                onToggleVis={toggleVis}
                hint="Used when members tap WhatsApp on your profile."
                error={d.whatsappLink && !isValidPhone(d.whatsappLink) ? "Enter a valid WhatsApp number." : null}
              >
                <PhoneField value={d.whatsappLink} onChange={(v) => set("whatsappLink", v)} />
              </Field>

              <Field
                label="Work email"
                required
                eyeKey="work_email"
                vis={vis}
                onToggleVis={toggleVis}
                error={validateField("workEmail", d.workEmail)}
              >
                <input type="email" className={cls.input} value={d.workEmail} onChange={(e) => set("workEmail", e.target.value)} autoComplete="work email" />
              </Field>

              <Field
                label="Personal email"
                required
                eyeKey="personal_email"
                vis={vis}
                onToggleVis={toggleVis}
                error={validateField("personalEmail", d.personalEmail)}
              >
                <input type="email" className={cls.input} value={d.personalEmail} onChange={(e) => set("personalEmail", e.target.value)} />
              </Field>
            </div>

            <div className="rounded-2xl border border-hairline bg-surface-sunk/50 p-5 space-y-5">
              <Field label="Best time to connect" hint="Optional — pick your available days and hours.">
                <BestTimePicker value={d.bestTime} onChange={(v) => set("bestTime", v)} />
              </Field>

              <Field label="Best mode to connect" required>
                <div className="mt-1 flex flex-wrap gap-2">
                  {CONNECT_MODES.map((m) => {
                    const on = d.bestModes.includes(m.value);
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => toggleMode(m.value)}
                        aria-pressed={on}
                        className={cls.segBtn(on)}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="WhatsApp DM from the portal">
                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {(["yes", "no", "dnd"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => set("whatsappDmPref", p)}
                        className={cls.segBtn(d.whatsappDmPref === p)}
                      >
                        {p === "dnd" ? "DND" : p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                  <EyeBtn on={isFieldVisible(vis, "whatsapp")} onToggle={() => toggleVis("whatsapp")} label="WhatsApp" />
                </div>
              </Field>
            </div>
          </ScreenShell>
        )}

        {/* ── Steps 4 / 5 / 6: Addresses ────────────────────────────────── */}
        {step === 4 && (
          <ScreenShell step={4}>
            <div className="flex items-center justify-between">
              <span className={cls.label}>
                Work address<span className="ml-1 text-red" aria-hidden="true">*</span>
              </span>
              <EyeBtn on={isFieldVisible(vis, "work_address")} onToggle={() => toggleVis("work_address")} label="Work address" />
            </div>
            <AddressFields value={d.workAddress} onChange={(k, v) => setAddr("workAddress", k, v)} />
          </ScreenShell>
        )}

        {step === 5 && (
          <ScreenShell step={5}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {([["enter", "Enter home address"], ["same", "Same as business"], ["none", "Don't wish to provide"]] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setHomeMode(mode);
                      if (mode === "same") copyFromWork("homeAddress");
                    }}
                    className={cls.segBtn(homeMode === mode)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {homeMode !== "none" && (
                <EyeBtn on={isFieldVisible(vis, "home_address")} onToggle={() => toggleVis("home_address")} label="Home address" />
              )}
            </div>
            {homeMode === "enter" && (
              <AddressFields value={d.homeAddress} onChange={(k, v) => setAddr("homeAddress", k, v)} />
            )}
            {homeMode === "same" && (
              <div className="rounded-xl border border-hairline bg-surface-sunk/50 px-4 py-3 text-[14px] text-ink-muted">
                Using your business address as your home address.
              </div>
            )}
            {homeMode === "none" && (
              <div className="rounded-xl border border-hairline bg-surface-sunk/50 px-4 py-3 text-[14px] text-ink-muted">
                No home address will be saved. You can add one later from your profile.
              </div>
            )}
          </ScreenShell>
        )}

        {step === 6 && (
          <ScreenShell step={6}>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => copyFromWork("factoryAddress")}
                className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-white px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-hairline-bright"
              >
                Same as business address
              </button>
              <EyeBtn on={isFieldVisible(vis, "factory_address")} onToggle={() => toggleVis("factory_address")} label="Factory address" />
            </div>
            <AddressFields value={d.factoryAddress} onChange={(k, v) => setAddr("factoryAddress", k, v)} />
          </ScreenShell>
        )}

        {/* ── Step 7: Portfolio & Socials ────────────────────────────────── */}
        {step === 7 && (
          <ScreenShell step={7}>
            {/* Attachments */}
            <div className="space-y-3">
              <span className={cls.label}>Brochures & media attachments</span>
              {d.attachments.map((a, i) => (
                <div key={i} className="rounded-2xl border border-hairline bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <select
                      className={cls.input + " max-w-[180px]"}
                      value={a.kind}
                      onChange={(e) => patchAttachment(i, { kind: e.target.value as AttachmentKind, url: "", filePath: "" })}
                    >
                      {(Object.keys(ATTACHMENT_KIND_LABELS) as AttachmentKind[]).map((k) => (
                        <option key={k} value={k}>{ATTACHMENT_KIND_LABELS[k]}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] text-ink-muted transition-colors hover:bg-red/8 hover:text-red"
                    >
                      <span>{Icon.trash}</span>
                      <span>Remove</span>
                    </button>
                  </div>
                  <input className={cls.input} placeholder="Title (e.g. Company Brochure 2025)" value={a.title} onChange={(e) => patchAttachment(i, { title: e.target.value })} />
                  {isFileKind(a.kind) ? (
                    <AttachmentFile
                      filePath={a.filePath}
                      configured={configured}
                      onFile={(f) => uploadAttachment(i, f)}
                      onPath={(v) => patchAttachment(i, { filePath: v })}
                      onClear={() => patchAttachment(i, { filePath: "" })}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-ink-muted">{Icon.link}</span>
                      <input className={cls.input} placeholder="https://…" value={a.url} onChange={(e) => patchAttachment(i, { url: e.target.value })} />
                    </div>
                  )}
                </div>
              ))}
              {d.attachments.length < MAX_ATTACHMENTS && (
                <button
                  type="button"
                  onClick={addAttachment}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline px-4 py-3 text-[13px] font-medium text-ink-muted transition-colors hover:border-hairline-bright hover:text-ink"
                >
                  <span>{Icon.plus}</span>
                  Add brochure or video
                </button>
              )}
            </div>

            {/* Social channels */}
            <div className="border-t border-hairline pt-6">
              <span className={cls.label + " mb-3 block"}>Social & connect channels</span>
              <p className="mb-4 text-[13px] text-ink-muted leading-relaxed">
                Enter direct link URLs or use Quick Connect to add handles by platform.
              </p>
              <SocialLinksManager d={d} set={set} vis={vis} onToggleVis={toggleVis} />
            </div>
          </ScreenShell>
        )}

        {/* ── Step 8: Networking ────────────────────────────────────────── */}
        {step === 8 && (
          <ScreenShell step={8}>
            <Field label="Areas of interest" eyeKey="areas_of_interest" vis={vis} onToggleVis={toggleVis}>
              <textarea className={cls.area} value={d.areasOfInterest} onChange={(e) => set("areasOfInterest", e.target.value)} placeholder="Sustainability, Manufacturing, B2B exports, Strategic partnerships…" />
            </Field>

            <Field label="Expertise" hint="Comma-separated. E.g. Manufacturing, Exports, B2B Sales">
              <input
                className={cls.input}
                value={d.expertise.join(", ")}
                placeholder="Manufacturing, Exports, B2B Sales"
                onChange={(e) => set("expertise", e.target.value.split(",").map((s) => s.trimStart()))}
                onBlur={(e) => set("expertise", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              />
            </Field>

            <Field label="Associations & forums" hint="e.g. BNI Premiere, Ascent Imperium" eyeKey="network_groups" vis={vis} onToggleVis={toggleVis}>
              <ChipInput value={d.networkGroups} onChange={(v) => set("networkGroups", v)} placeholder="Add an association or forum" />
            </Field>

            <Field label="Companies / people you can connect others to" hint="e.g. Hindustan Lever — Mr. Mitra, Director" eyeKey="can_connect" vis={vis} onToggleVis={toggleVis}>
              <ChipInput value={d.canConnect} onChange={(v) => set("canConnect", v)} placeholder="Add a company or person" />
            </Field>

            <Field label="Companies / people you want to connect with" eyeKey="want_connect" vis={vis} onToggleVis={toggleVis}>
              <ChipInput value={d.wantConnect} onChange={(v) => set("wantConnect", v)} placeholder="Add a company or person" />
            </Field>

            <Field label="Favourite productivity tools" hint={`Pick up to 3 · ${tools.length}/3 selected`}>
              <div className="flex flex-wrap gap-2 mt-1">
                {TOOLS.map((t) => {
                  const on = tools.includes(t);
                  const disabled = !on && tools.length >= 3;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleTool(t)}
                      aria-pressed={on}
                      className={cls.segBtn(on) + " disabled:opacity-40 disabled:cursor-not-allowed"}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Your purpose / success philosophy">
              <textarea className={cls.area} value={d.purpose} onChange={(e) => set("purpose", e.target.value)} placeholder="What drives you every day…" />
            </Field>
          </ScreenShell>
        )}

        {/* ── Step 9: Community / Altus journey ─────────────────────────── */}
        {step === 9 && (
          <ScreenShell step={9}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="PS batch" required>
                <input className={cls.input} value={d.psBatch} onChange={(e) => set("psBatch", e.target.value)} placeholder="e.g. PS-12" />
              </Field>
              <Field label="CQ batch" required>
                <input className={cls.input} value={d.cqBatch} onChange={(e) => set("cqBatch", e.target.value)} placeholder="e.g. CQ-07" />
              </Field>
              <Field label="BSS batch" required>
                <input className={cls.input} value={d.bssBatch} onChange={(e) => set("bssBatch", e.target.value)} placeholder="e.g. BSS-03" />
              </Field>
            </div>

            {d.conclavesAttended > 0 && (
              <div className="rounded-2xl border border-hairline bg-surface-sunk/50 px-5 py-4">
                <p className={cls.label}>Conclaves attended</p>
                <p className="mt-1 text-[22px] font-bold text-ink">{d.conclavesAttended}</p>
                <p className="text-[12px] text-ink-muted">From Altus records — not editable here.</p>
              </div>
            )}

            <Field label="Interested in helping or assisting others?">
              <div className="mt-1"><Segmented value={d.interestedHelping} options={YES_NO_MAYBE} onChange={(v) => set("interestedHelping", v)} /></div>
            </Field>

            <Field label="Interested in coaching or mentoring others?">
              <div className="mt-1"><Segmented value={d.interestedCoaching} options={YES_NO_MAYBE} onChange={(v) => set("interestedCoaching", v)} /></div>
            </Field>

            <Field label="Interested in business networking?">
              <div className="mt-1"><Segmented value={d.interestedNetworking} options={NETWORK_PREF} onChange={(v) => set("interestedNetworking", v)} /></div>
            </Field>

            <Field label="How can you contribute to this Tribe?" eyeKey="contribution" vis={vis} onToggleVis={toggleVis}>
              <textarea className={cls.area} value={d.contribution} onChange={(e) => set("contribution", e.target.value)} />
            </Field>

            <Field label="How did Manan Vasa's programmes benefit you at work?">
              <textarea className={cls.area} value={d.programBenefitWork} onChange={(e) => set("programBenefitWork", e.target.value)} />
            </Field>

            <Field label="How did they benefit you personally?">
              <textarea className={cls.area} value={d.programBenefitPersonal} onChange={(e) => set("programBenefitPersonal", e.target.value)} />
            </Field>
          </ScreenShell>
        )}

        {/* ── Step 10: Privacy ──────────────────────────────────────────── */}
        {step === 10 && (
          <ScreenShell step={10}>
            <Field label="Who can see your profile?">
              <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { v: "public", t: "Public", h: "Anyone with the link" },
                  { v: "tribe", t: "Members only", h: "Signed-in Tribe members" },
                  { v: "private", t: "Hidden", h: "Only you & admins" },
                ].map((o) => {
                  const on = d.visibility === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => set("visibility", o.v as EditableProfile["visibility"])}
                      aria-pressed={on}
                      className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                        on
                          ? "border-red/30 bg-red/8 shadow-sm"
                          : "border-hairline bg-white hover:border-hairline-bright"
                      }`}
                    >
                      <p className={`text-[15px] font-semibold ${on ? "text-red" : "text-ink"}`}>{o.t}</p>
                      <p className="mt-0.5 text-[12px] text-ink-muted">{o.h}</p>
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="rounded-2xl border border-hairline bg-white p-5">
              <p className={cls.label + " mb-3"}>Show or hide individual fields</p>
              <div className="divide-y divide-hairline">
                {VISIBILITY_FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center justify-between py-3">
                    <span className="text-[14px] text-ink">{f.label}</span>
                    <EyeBtn
                      on={isFieldVisible(vis, f.key)}
                      onToggle={() => toggleVis(f.key)}
                      label={f.label}
                    />
                  </div>
                ))}
              </div>
            </div>
          </ScreenShell>
        )}

        {/* ── Step 11: Review ───────────────────────────────────────────── */}
        {step === 11 && (
          <ScreenShell step={11}>
            <div className="space-y-4">
              <ReviewGroup title="Personal"    onEdit={() => goto(1)} rows={[["Name", composeFullName(d) || "—"], ["Birth date", d.birthDate || "—"], ["Blood group", d.bloodGroup || "—"], ["Biography", trunc(d.about)]]} />
              <ReviewGroup title="Business"    onEdit={() => goto(2)} rows={[["Business", d.businessName || "—"], ["Category", d.category || "—"], ["Industry", d.industry || "—"], ["USP", trunc(d.usp)]]} />
              <ReviewGroup title="Contact"     onEdit={() => goto(3)} rows={[["Mobile", d.cellNo || "—"], ["Work email", d.workEmail || "—"], ["Best modes", d.bestModes.join(", ") || "—"]]} />
              <ReviewGroup title="Portfolio"   onEdit={() => goto(7)} rows={[["Attachments", String(d.attachments.length)], ["LinkedIn", d.linkedin || "—"]]} />
              <ReviewGroup title="Networking"  onEdit={() => goto(8)} rows={[["Interests", trunc(d.areasOfInterest)], ["Tools", d.favouriteTools || "—"]]} />
              <ReviewGroup title="Altus batches" onEdit={() => goto(9)} rows={[["PS", d.psBatch || "—"], ["CQ", d.cqBatch || "—"], ["BSS", d.bssBatch || "—"]]} />
            </div>

            {/* Validation summary */}
            {!canFinish ? (
              <div className="rounded-2xl border border-red/20 bg-red/5 px-5 py-4">
                <p className="text-[14px] font-semibold text-ink mb-2">A few required details are still needed:</p>
                <ul className="space-y-1">
                  {missingRequired.map((m) => (
                    <li key={m} className="flex items-center gap-2 text-[13px] text-red">
                      <span className="h-1.5 w-1.5 rounded-full bg-red flex-shrink-0" aria-hidden="true" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-2xl border border-hairline bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red/10 text-red">{Icon.check}</span>
                  <div>
                    <p className="text-[15px] font-semibold text-ink">Ready to go live</p>
                    <p className="text-[13px] text-ink-muted">Profile richness: {completion}%{completion < 100 && " — optional fields can be added anytime."}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Legal declarations */}
            <div className="rounded-2xl border border-hairline bg-white p-5 space-y-4">
              <p className={cls.label}>Before you submit</p>
              {[
                { state: certifyAccurate,      setState: setCertifyAccurate,      text: "I certify that the information I've provided is accurate." },
                { state: understandDisplay,     setState: setUnderstandDisplay,    text: "I understand my profile will be displayed according to my selected privacy settings." },
                { state: agreeDeclaration,      setState: setAgreeDeclaration,     text: null },
              ].map((item, idx) => (
                <label key={idx} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => item.setState(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-hairline accent-red cursor-pointer"
                  />
                  <span className="text-[14px] text-ink-secondary leading-relaxed">
                    {idx === 2 ? (
                      <>
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={() => setLegalDoc("declaration")}
                          className="font-semibold text-ink underline hover:text-red transition-colors"
                        >
                          Altus Tribe Profile Declaration
                        </button>
                        .
                      </>
                    ) : item.text}
                  </span>
                </label>
              ))}
            </div>
          </ScreenShell>
        )}

        {/* ── Step 12: Completion ───────────────────────────────────────── */}
        {step === COMPLETION && (
          <CompletionStep
            fullName={composeFullName(d)}
            slug={slug}
            configured={configured}
            onEnter={enter}
            finishing={finishing}
          />
        )}

        {/* ── Navigation bar ─────────────────────────────────────────────── */}
        {step >= FIRST_CONTENT && step <= LAST_CONTENT && (
          <div className="mt-12 flex items-center justify-between border-t border-hairline pt-6">
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-white px-5 py-3 text-[14px] font-medium text-ink transition-colors hover:border-hairline-bright"
            >
              <span aria-hidden="true">{Icon.arrowLeft}</span>
              Back
            </button>

            {step < LAST_CONTENT ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-2 rounded-xl bg-red px-7 py-3 text-[15px] font-semibold text-white shadow-sm shadow-red/20 transition-all hover:bg-red-hover active:scale-95"
              >
                Continue
                <span aria-hidden="true">{Icon.arrowRight}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={finishing || !canFinish || !certifyAccurate || !understandDisplay || !agreeDeclaration}
                className="inline-flex items-center gap-2 rounded-xl bg-red px-7 py-3 text-[15px] font-semibold text-white shadow-sm shadow-red/20 transition-all hover:bg-red-hover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {finishing ? "Saving…" : "Submit & finish"}
                <span aria-hidden="true">{Icon.arrowRight}</span>
              </button>
            )}
          </div>
        )}
      </main>

      <LegalModal type={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}
