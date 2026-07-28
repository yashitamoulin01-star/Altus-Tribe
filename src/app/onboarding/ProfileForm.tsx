"use client";

// ═══════════════════════════════════════════════════════════════════════════
// ProfileForm — the SINGLE shared registration form.
// Used identically by onboarding (after Request Access) AND profile completion
// (account edit + admin edit). One source of truth, so the two can never drift.
//
// Renders all 48 CQ Tribe fields in the owner's EXACT numeric order (1→48),
// grouped into the owner's 13 collapsible accordion sections. Sticky section
// nav, per-section completion, and submit-time error focusing. Theme: only
// Red / White / Grey / Black.  See memory: form-48-field-spec.
// ═══════════════════════════════════════════════════════════════════════════

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { uploadFile } from "@/lib/storage-client";
import { lookupPincode } from "@/lib/pincode";
import { isValidPhone } from "@/lib/phone";
import PhoneField from "@/components/PhoneField";
import ChipInput from "@/components/ChipInput";
import ComboInput from "@/components/ComboInput";
import BestTimePicker from "@/components/BestTimePicker";
import { COUNTRIES, INDIA_STATES, INDIA_CITIES } from "@/lib/geo";
import {
  ADDRESS_PLACEHOLDERS,
  BEST_TIME_PLACEHOLDER,
  CONNECT_MODES,
  MAX_ATTACHMENTS,
  MAX_PHOTO_BYTES,
  PHOTO_ACCEPT,
  PHOTO_HINT,
  PHOTO_TOO_LARGE_MSG,
  isFieldVisible,
  isFileKind,
  validateField,
  type AttachmentKind,
  type EditableAddress,
  type EditableAttachment,
  type EditableProfile,
  type FieldVisibility,
} from "@/lib/profile-fields";

// ─── Option lists (verbatim from the matrix) ────────────────────────────────
const MARITAL = ["Single", "Dating", "Married", "Separated", "Divorced", "Widowed", "Confidential"];
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const YES_NO_MAYBE = ["Yes", "No", "Maybe"];
const NETWORK_PREF = ["Online", "Physically", "Both", "No"];
const DM_PREF: { value: "yes" | "no" | "dnd"; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "dnd", label: "DND" },
];
const TOOLS = [
  "Time Auditer", "Power Planner", "Reasons Eliminator", "Time Finder",
  "TFCR Model", "MIH Framework", "Performance Builder", "Habits Enhancer",
  "Meeting Success Maximizer", "Communication Manager", "Sales Cultivator",
  "Productivity Calculator",
];
const BROCHURE_KINDS: AttachmentKind[] = ["brochure", "image"];
const VIDEO_KINDS: AttachmentKind[] = ["video", "case_study"];

// ─── Design tokens (Red / White / Grey / Black only) ────────────────────────
const cls = {
  input:
    "w-full rounded-xl border border-hairline bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink-muted transition-colors focus:border-red/40 focus:outline-none focus:ring-4 focus:ring-red/8 dark:bg-surface-sunk",
  area:
    "w-full rounded-xl border border-hairline bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink-muted transition-colors focus:border-red/40 focus:outline-none focus:ring-4 focus:ring-red/8 leading-relaxed resize-y min-h-[104px] dark:bg-surface-sunk",
  label: "block text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted mb-1.5",
  fieldWrap: "space-y-1.5",
  segBtn: (on: boolean) =>
    `rounded-xl border px-3.5 py-2 text-[13px] font-medium transition-all select-none cursor-pointer ${
      on
        ? "border-red/40 bg-red/8 text-red shadow-sm"
        : "border-hairline bg-white text-ink-muted hover:border-hairline-bright hover:text-ink dark:bg-surface"
    }`,
  errorRing: "ring-4 ring-red/25 border-red/60 rounded-xl",
};

const Icon = {
  chevron: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  eyeOff: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
  ),
  link: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
  ),
  check: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  ),
};

// ─── Big, unmistakable show/hide pill (green = shown, red = hidden) ──────────
function EyeBtn({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label={on ? `Hide ${label} on profile` : `Show ${label} on profile`}
      title={on ? "Visible on profile — click to hide" : "Hidden — click to show"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
        on
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-red/40 bg-red/8 text-red"
      }`}
    >
      <span aria-hidden="true">{on ? Icon.eye : Icon.eyeOff}</span>
      {on ? "Shown" : "Hidden"}
    </button>
  );
}

// ─── Field wrapper (label + asterisk + eye + error) ─────────────────────────
function Field({
  label,
  hint,
  error,
  required,
  eyeKey,
  vis,
  onToggleVis,
  dataKey,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  eyeKey?: string;
  vis?: FieldVisibility;
  onToggleVis?: (k: string) => void;
  dataKey?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cls.fieldWrap} data-field={dataKey}>
      <div className="flex items-center justify-between gap-2">
        <label className={cls.label}>
          {label}
          {required && <span className="ml-1 text-red" aria-hidden="true">*</span>}
        </label>
        {eyeKey && vis && onToggleVis && (
          <EyeBtn on={isFieldVisible(vis, eyeKey)} onToggle={() => onToggleVis(eyeKey)} label={label} />
        )}
      </div>
      {children}
      {hint && !error && <p className="text-[12px] leading-relaxed text-ink-muted">{hint}</p>}
      {error && (
        <p role="alert" className="flex items-center gap-1 text-[12px] text-red">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm0 9a1.25 1.25 0 110 2.5A1.25 1.25 0 0112 16z" /></svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Single-select chip group ───────────────────────────────────────────────
function RadioGroup({ value, options, onChange, allowClear = true }: { value: string; options: string[]; onChange: (v: string) => void; allowClear?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(allowClear && value === o ? "" : o)} aria-pressed={value === o} className={cls.segBtn(value === o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function AddrLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <span className={cls.label}>
      {text}
      {required && <span className="ml-1 text-red" aria-hidden="true">*</span>}
    </span>
  );
}

// ─── Address block (grey embedded placeholders + comboboxes + PIN lookup) ───
// `linesRequired` marks line 1–4 + city/state/country/PIN with an asterisk
// (Work address). Home / Factory pass it false.
function AddressFields({
  value,
  onChange,
  linesRequired,
}: {
  value: EditableAddress;
  onChange: (k: keyof EditableAddress, v: string) => void;
  linesRequired?: boolean;
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
    if (!r) { setHint("Could not look that up — please fill city / state / country manually."); return; }
    if (!value.city.trim()) onChange("city", r.city);
    if (!value.state.trim()) onChange("state", r.state);
    if (!value.country.trim()) onChange("country", r.country);
    setHint("Suggested from your PIN code — edit if needed.");
  };

  return (
    <div className="space-y-3">
      <div className={cls.fieldWrap}><AddrLabel text="Address line 1" required={linesRequired} /><input className={cls.input} placeholder={ADDRESS_PLACEHOLDERS.line1} value={value.line1} onChange={(e) => onChange("line1", e.target.value)} /></div>
      <div className={cls.fieldWrap}><AddrLabel text="Address line 2" required={linesRequired} /><input className={cls.input} placeholder={ADDRESS_PLACEHOLDERS.line2} value={value.line2} onChange={(e) => onChange("line2", e.target.value)} /></div>
      <div className={cls.fieldWrap}><AddrLabel text="Address line 3" required={linesRequired} /><input className={cls.input} placeholder={ADDRESS_PLACEHOLDERS.line3} value={value.line3} onChange={(e) => onChange("line3", e.target.value)} /></div>
      <div className={cls.fieldWrap}><AddrLabel text="Address line 4" required={linesRequired} /><input className={cls.input} placeholder={ADDRESS_PLACEHOLDERS.line4} value={value.line4} onChange={(e) => onChange("line4", e.target.value)} /></div>
      <div className={cls.fieldWrap}><AddrLabel text="Nearby landmark" /><input className={cls.input} placeholder={ADDRESS_PLACEHOLDERS.landmark} value={value.landmark} onChange={(e) => onChange("landmark", e.target.value)} /></div>
      <div className={cls.fieldWrap}>
        <AddrLabel text="PIN / postal code" required={linesRequired} />
        <input className={cls.input} inputMode="numeric" placeholder={ADDRESS_PLACEHOLDERS.pincode} value={value.pincode} onChange={(e) => onPincode(e.target.value)} />
        {(looking || hint) && <p className="mt-1 text-[12px] text-ink-muted">{looking ? "Looking up…" : hint}</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={cls.fieldWrap}><AddrLabel text="City" required={linesRequired} /><ComboInput className={cls.input} options={INDIA_CITIES} placeholder={ADDRESS_PLACEHOLDERS.city} value={value.city} onChange={(v) => onChange("city", v)} /></div>
        <div className={cls.fieldWrap}><AddrLabel text="State" required={linesRequired} /><ComboInput className={cls.input} options={INDIA_STATES} placeholder={ADDRESS_PLACEHOLDERS.state} value={value.state} onChange={(v) => onChange("state", v)} /></div>
        <div className={cls.fieldWrap}><AddrLabel text="Country" required={linesRequired} /><ComboInput className={cls.input} options={COUNTRIES} placeholder={ADDRESS_PLACEHOLDERS.country} value={value.country} onChange={(v) => onChange("country", v)} /></div>
      </div>
      <div className={cls.fieldWrap}><AddrLabel text="Google Maps link" /><input className={cls.input} placeholder={ADDRESS_PLACEHOLDERS.mapLink} value={value.mapLink} onChange={(e) => onChange("mapLink", e.target.value)} /></div>
    </div>
  );
}

// ─── Image picker (20 MB, JPG/JPEG/PNG, instant red on oversize) ────────────
function ImagePicker({ label, value, configured, userId, bucket, aspect, onUrl }: {
  label: string; value: string; configured: boolean; userId: string | null; bucket: string; aspect: string; onUrl: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    if (f.size > MAX_PHOTO_BYTES) { setErr(PHOTO_TOO_LARGE_MSG); return; }
    if (!userId) { setErr("Not signed in."); return; }
    setBusy(true);
    const r = await uploadFile(bucket, userId, f, { allow: "image" });
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    onUrl(r.publicUrl ?? "");
  };
  return (
    <div>
      <span className={cls.label}>{label}</span>
      <div className="mt-1.5 flex items-start gap-4">
        <div className={`${aspect} w-20 shrink-0 overflow-hidden rounded-xl border border-hairline bg-surface-sunk`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-muted">{Icon.upload}</div>
          )}
        </div>
        <div className="flex-1 space-y-2 pt-1">
          {configured ? (
            <>
              <input ref={ref} type="file" accept={PHOTO_ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-white px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-hairline-bright disabled:opacity-60">
                <span aria-hidden="true">{Icon.upload}</span>{busy ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
              </button>
              {value && <button type="button" onClick={() => onUrl("")} className="ml-2 text-[13px] text-ink-muted underline transition-colors hover:text-red">Remove</button>}
            </>
          ) : (
            <input className={cls.input} placeholder="https://…/image.jpg" value={value} onChange={(e) => onUrl(e.target.value)} />
          )}
          <p className="text-[12px] text-ink-muted">{PHOTO_HINT}</p>
          {err && <p className="text-[12px] text-red">{err}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Social link row ────────────────────────────────────────────────────────
function SocialRow({ icon, label, value, onChange, placeholder, eyeKey, vis, onToggleVis }: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder: string; eyeKey?: string; vis?: FieldVisibility; onToggleVis?: (k: string) => void;
}) {
  return (
    <Field label={label} eyeKey={eyeKey} vis={vis} onToggleVis={onToggleVis}>
      <div className="flex items-center gap-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-hairline bg-surface-sunk text-ink-muted">{icon}</span>
        <input className={cls.input} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    </Field>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Section model — exact owner grouping, exact field order.
// ═══════════════════════════════════════════════════════════════════════════
const SECTIONS = [
  "Personal Identity",
  "Business Identity",
  "Contact Information",
  "Work Address",
  "Home Address",
  "Factory / Warehouse",
  "Business Profile",
  "Social & Digital",
  "Batch Information",
  "Personal Details",
  "Professional Network",
  "Altus Experience",
  "Community & Tribe",
] as const;

const addrHasContent = (a: EditableAddress) => Object.values(a).some((v) => v.trim().length > 0);

// Per-section [filled, total] counters — drive the completion indicators.
function sectionStats(d: EditableProfile): [number, number][] {
  const f = (b: boolean) => (b ? 1 : 0);
  const nonEmpty = (s: string) => s.trim().length > 0;
  const wa = d.workAddress;
  const tools = d.favouriteTools ? d.favouriteTools.split(",").filter((s) => s.trim()).length : 0;
  return [
    // 1 Personal Identity (1–4): photo, first, middle, last
    [f(nonEmpty(d.photoUrl)) + f(nonEmpty(d.firstName)) + f(nonEmpty(d.middleName)) + f(nonEmpty(d.lastName)), 4],
    // 2 Business Identity (5–7): logo, business name, brand names
    [f(nonEmpty(d.companyLogoUrl)) + f(nonEmpty(d.businessName)) + f(nonEmpty(d.brandNames)), 3],
    // 3 Contact (8–10)
    [f(isValidPhone(d.cellNo)) + f(isValidPhone(d.altNo)) + f(nonEmpty(d.workEmail)), 3],
    // 4 Work Address (11) — 10 sub-fields
    [[wa.line1, wa.line2, wa.line3, wa.line4, wa.landmark, wa.city, wa.state, wa.country, wa.pincode, wa.mapLink].filter((v) => v.trim()).length, 10],
    // 5 Home Address (12–13): block + personal email
    [f(addrHasContent(d.homeAddress)) + f(nonEmpty(d.personalEmail)), 2],
    // 6 Factory (14)
    [f(addrHasContent(d.factoryAddress)), 1],
    // 7 Business Profile (15–23): website, nature, usp, brochures, videos, cat, ind, time, mode
    [f(nonEmpty(d.companyWebsite)) + f(nonEmpty(d.natureOfBusiness)) + f(nonEmpty(d.usp))
      + f(d.attachments.some((a) => BROCHURE_KINDS.includes(a.kind))) + f(d.attachments.some((a) => VIDEO_KINDS.includes(a.kind)))
      + f(nonEmpty(d.category)) + f(nonEmpty(d.industry)) + f(nonEmpty(d.bestTime)) + f(d.bestModes.length > 0), 9],
    // 8 Social (24–28): linkedin, biz insta, personal insta, youtube, whatsapp DM
    [f(nonEmpty(d.linkedin)) + f(nonEmpty(d.businessInstagram)) + f(nonEmpty(d.personalInstagram)) + f(nonEmpty(d.youtube)) + f(nonEmpty(d.whatsappDmPref)), 5],
    // 9 Batch (29–30): PS, CQ, BSS
    [f(nonEmpty(d.psBatch)) + f(nonEmpty(d.cqBatch)) + f(nonEmpty(d.bssBatch)), 3],
    // 10 Personal Details (31–36): interests, birth, marital, anniversary, blood, bio
    [f(nonEmpty(d.areasOfInterest)) + f(nonEmpty(d.birthDate)) + f(nonEmpty(d.maritalStatus)) + f(nonEmpty(d.anniversary)) + f(nonEmpty(d.bloodGroup)) + f(nonEmpty(d.about)), 6],
    // 11 Professional Network (37–39)
    [f(nonEmpty(d.networkGroups)) + f(nonEmpty(d.canConnect)) + f(nonEmpty(d.wantConnect)), 3],
    // 12 Altus Experience (40–43): benefit work, benefit personal, tools, purpose
    [f(nonEmpty(d.programBenefitWork)) + f(nonEmpty(d.programBenefitPersonal)) + f(tools > 0) + f(nonEmpty(d.purpose)), 4],
    // 13 Community (44–48): helping, contribution, coaching, networking, conclaves(auto)
    [f(nonEmpty(d.interestedHelping)) + f(nonEmpty(d.contribution)) + f(nonEmpty(d.interestedCoaching)) + f(nonEmpty(d.interestedNetworking)) + f(d.conclavesAttended > 0), 5],
  ];
}

// Required fields (member-gating) → {key for scroll/ref, section index, ok}.
const REQUIRED: { key: string; section: number; ok: (d: EditableProfile) => boolean }[] = [
  { key: "firstName", section: 0, ok: (d) => d.firstName.trim().length > 0 },
  { key: "lastName", section: 0, ok: (d) => d.lastName.trim().length > 0 },
  { key: "businessName", section: 1, ok: (d) => d.businessName.trim().length > 0 },
  { key: "cellNo", section: 2, ok: (d) => isValidPhone(d.cellNo) },
  { key: "altNo", section: 2, ok: (d) => isValidPhone(d.altNo) },
  { key: "workEmail", section: 2, ok: (d) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.workEmail.trim()) },
  { key: "workAddress", section: 3, ok: (d) => [d.workAddress.line1, d.workAddress.line2, d.workAddress.line3, d.workAddress.line4, d.workAddress.city, d.workAddress.state, d.workAddress.country, d.workAddress.pincode].every((v) => v.trim().length > 0) },
  { key: "category", section: 6, ok: (d) => d.category.trim().length > 0 },
  { key: "industry", section: 6, ok: (d) => d.industry.trim().length > 0 },
  { key: "bestModes", section: 6, ok: (d) => d.bestModes.length > 0 },
  { key: "birthDate", section: 9, ok: (d) => d.birthDate.trim().length > 0 },
  { key: "bloodGroup", section: 9, ok: (d) => d.bloodGroup.trim().length > 0 },
];

// ─── Collapsible accordion card ─────────────────────────────────────────────
function Accordion({ index, title, filled, total, open, onToggle, children }: {
  index: number; title: string; filled: number; total: number; open: boolean; onToggle: () => void;
  children: React.ReactNode;
}) {
  const done = filled >= total;
  return (
    <section data-section={index} className="scroll-mt-24 overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-hover">
        <span className="flex items-center gap-3">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${done ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-red/10 text-red"}`}>
            {done ? Icon.check : index + 1}
          </span>
          <span className="text-[15px] font-semibold text-ink sm:text-[16px]">{title}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className={`hidden text-[12px] font-semibold tabular-nums sm:inline ${done ? "text-emerald-700 dark:text-emerald-400" : "text-ink-muted"}`}>{filled}/{total} completed</span>
          <span className={`text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}>{Icon.chevron}</span>
        </span>
      </button>
      {open && <div className="border-t border-hairline px-5 py-6 space-y-6">{children}</div>}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export interface ProfileFormHandle {
  revealFirstError: () => boolean; // true if a missing required field was revealed
}

interface Props {
  d: EditableProfile;
  vis: FieldVisibility;
  set: <K extends keyof EditableProfile>(k: K, v: EditableProfile[K]) => void;
  setAddr: (which: "workAddress" | "homeAddress" | "factoryAddress", k: keyof EditableAddress, v: string) => void;
  copyFromWork: (which: "homeAddress" | "factoryAddress") => void;
  toggleVis: (key: string) => void;
  configured: boolean;
  userId: string | null;
  industries: string[];
  categories: string[];
  canEditBatches?: boolean; // admin editing another member
}

const ProfileForm = forwardRef<ProfileFormHandle, Props>(function ProfileForm(
  { d, vis, set, setAddr, copyFromWork, toggleVis, configured, userId, industries, categories, canEditBatches = false },
  handleRef,
) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const [active, setActive] = useState(0);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [homeMode, setHomeMode] = useState<"enter" | "same" | "none">("enter");
  const [factoryMode, setFactoryMode] = useState<"enter" | "same" | "none">(addrHasContent(d.factoryAddress) ? "enter" : "none");

  const rootRef = useRef<HTMLDivElement>(null);
  const stats = useMemo(() => sectionStats(d), [d]);

  const scrollTo = (selector: string) => {
    requestAnimationFrame(() => rootRef.current?.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  const openAndScroll = (i: number) => {
    setOpen((s) => new Set(s).add(i));
    setActive(i);
    scrollTo(`[data-section="${i}"]`);
  };

  useImperativeHandle(handleRef, () => ({
    revealFirstError() {
      const miss = REQUIRED.find((r) => !r.ok(d));
      if (!miss) { setErrorKey(null); return false; }
      setOpen((s) => new Set(s).add(miss.section));
      setActive(miss.section);
      setErrorKey(miss.key);
      scrollTo(`[data-field="${miss.key}"]`);
      return true;
    },
  }), [d]);

  const errFor = (key: string) => (errorKey === key ? "This field is required." : null);

  // Attachment helpers (shared array; per-group cap enforced here).
  const patchAtt = (i: number, patch: Partial<EditableAttachment>) => set("attachments", d.attachments.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const removeAtt = (i: number) => set("attachments", d.attachments.filter((_, idx) => idx !== i));
  const addAtt = (kind: AttachmentKind) => set("attachments", [...d.attachments, { kind, title: "", url: "", filePath: "" }]);
  const uploadAtt = async (i: number, file: File) => {
    if (!userId) return;
    const r = await uploadFile("work-files", userId, file, { allow: "doc" });
    if (r.ok) patchAtt(i, { filePath: r.path });
  };
  const toggleMode = (m: string) => set("bestModes", d.bestModes.includes(m) ? d.bestModes.filter((x) => x !== m) : [...d.bestModes, m]);
  const tools = d.favouriteTools ? d.favouriteTools.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const toggleTool = (t: string) => {
    const has = tools.includes(t);
    const next = has ? tools.filter((x) => x !== t) : tools.length < 3 ? [...tools, t] : tools;
    set("favouriteTools", next.join(", "));
  };

  const overall = useMemo(() => {
    const [fill, tot] = stats.reduce(([a, b], [x, y]) => [a + x, b + y], [0, 0]);
    return Math.round((fill / tot) * 100);
  }, [stats]);

  // ── Attachment group renderer (Brochures / Videos) — plain function, not a
  // nested component, so it never remounts. ──
  const renderAttachments = (label: string, hint: string, kinds: AttachmentKind[], defaultKind: AttachmentKind) => {
    const group = d.attachments.map((att, i) => ({ att, i })).filter(({ att }) => kinds.includes(att.kind));
    return (
      <div className="space-y-3">
        <span className={cls.label}>{label}</span>
        {group.map(({ att, i }) => (
          <div key={i} className="space-y-3 rounded-2xl border border-hairline bg-surface-sunk/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <select className={cls.input + " max-w-[190px]"} value={att.kind} onChange={(e) => patchAtt(i, { kind: e.target.value as AttachmentKind, url: "", filePath: "" })}>
                {kinds.map((k) => <option key={k} value={k}>{k === "brochure" ? "Brochure (PDF)" : k === "image" ? "Image" : k === "video" ? "Video link" : "Case study link"}</option>)}
              </select>
              <button type="button" onClick={() => removeAtt(i)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] text-ink-muted transition-colors hover:bg-red/8 hover:text-red">{Icon.trash}Remove</button>
            </div>
            <input className={cls.input} placeholder="Title (e.g. Company Brochure 2026)" value={att.title} onChange={(e) => patchAtt(i, { title: e.target.value })} />
            {isFileKind(att.kind) ? (
              configured ? (
                <FileUpload filePath={att.filePath} onFile={(f) => uploadAtt(i, f)} onClear={() => patchAtt(i, { filePath: "" })} />
              ) : (
                <input className={cls.input} placeholder="Storage path or URL" value={att.filePath} onChange={(e) => patchAtt(i, { filePath: e.target.value })} />
              )
            ) : (
              <div className="flex items-center gap-2"><span className="text-ink-muted">{Icon.link}</span><input className={cls.input} placeholder="https://… (drive / document / video link)" value={att.url} onChange={(e) => patchAtt(i, { url: e.target.value })} /></div>
            )}
          </div>
        ))}
        {group.length < MAX_ATTACHMENTS ? (
          <button type="button" onClick={() => addAtt(defaultKind)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline px-4 py-3 text-[13px] font-medium text-ink-muted transition-colors hover:border-hairline-bright hover:text-ink">{Icon.plus}Add — upload from device or paste a link</button>
        ) : (
          <p className="text-[12px] text-ink-muted">Maximum {MAX_ATTACHMENTS} attachments reached.</p>
        )}
        <p className="text-[12px] text-ink-muted">{hint}</p>
      </div>
    );
  };

  return (
    <div ref={rootRef}>
      {/* Sticky section nav + overall progress */}
      <div className="sticky top-0 z-30 -mx-1 mb-6 border-b border-hairline bg-paper/90 px-1 py-3 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Overall progress</span>
          <span className="text-[13px] font-bold tabular-nums text-red">{overall}%</span>
        </div>
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk"><div className="h-full rounded-full bg-red transition-[width] duration-500" style={{ width: `${overall}%` }} /></div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SECTIONS.map((title, i) => {
            const [fl, to] = stats[i];
            return (
              <button key={title} type="button" onClick={() => openAndScroll(i)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${active === i ? "border-red/40 bg-red/8 text-red" : "border-hairline bg-white text-ink-muted hover:text-ink"}`}>
                {title}<span className="ml-1.5 text-[11px] opacity-70">{fl}/{to}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {/* ── 1. Personal Identity (1–4) ── */}
        <Accordion index={0} title={SECTIONS[0]} filled={stats[0][0]} total={stats[0][1]} open={open.has(0)} onToggle={() => toggle(0)}>
          <ImagePicker label="Participant photo" value={d.photoUrl} configured={configured} userId={userId} bucket="member-photos" aspect="aspect-[4/5]" onUrl={(v) => set("photoUrl", v)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Participant first name" required error={errFor("firstName")} dataKey="firstName">
              <input className={`${cls.input} ${errorKey === "firstName" ? cls.errorRing : ""}`} value={d.firstName} onChange={(e) => set("firstName", e.target.value.toUpperCase())} placeholder="PRIYA" autoComplete="given-name" />
            </Field>
            <Field label="Participant middle name">
              <input className={cls.input} value={d.middleName} onChange={(e) => set("middleName", e.target.value.toUpperCase())} />
            </Field>
            <Field label="Participant last name" required error={errFor("lastName")} dataKey="lastName">
              <input className={`${cls.input} ${errorKey === "lastName" ? cls.errorRing : ""}`} value={d.lastName} onChange={(e) => set("lastName", e.target.value.toUpperCase())} placeholder="SHAH" autoComplete="family-name" />
            </Field>
          </div>
        </Accordion>

        {/* ── 2. Business Identity (5–7) ── */}
        <Accordion index={1} title={SECTIONS[1]} filled={stats[1][0]} total={stats[1][1]} open={open.has(1)} onToggle={() => toggle(1)}>
          <ImagePicker label="Company logo" value={d.companyLogoUrl} configured={configured} userId={userId} bucket="member-photos" aspect="aspect-square" onUrl={(v) => set("companyLogoUrl", v)} />
          <Field label="Business name" required error={errFor("businessName")} dataKey="businessName">
            <input className={`${cls.input} ${errorKey === "businessName" ? cls.errorRing : ""}`} value={d.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Greentech Solutions" />
          </Field>
          <Field label="Brand names" hint="Comma-separated if you run more than one brand.">
            <input className={cls.input} value={d.brandNames} onChange={(e) => set("brandNames", e.target.value)} placeholder="GreenWrap, EcoBox" />
          </Field>
        </Accordion>

        {/* ── 3. Contact Information (8–10) ── */}
        <Accordion index={2} title={SECTIONS[2]} filled={stats[2][0]} total={stats[2][1]} open={open.has(2)} onToggle={() => toggle(2)}>
          <Field label="Cell no" required eyeKey="cell_no" vis={vis} onToggleVis={toggleVis} error={errFor("cellNo") ?? (d.cellNo && !isValidPhone(d.cellNo) ? "Enter a valid 10-digit mobile number." : null)} dataKey="cellNo">
            <PhoneField value={d.cellNo} onChange={(v) => set("cellNo", v)} autoComplete="tel" />
          </Field>
          <Field label="Alternate no" required eyeKey="alt_no" vis={vis} onToggleVis={toggleVis} error={errFor("altNo") ?? (d.altNo && !isValidPhone(d.altNo) ? "Enter a valid 10-digit mobile number." : null)} dataKey="altNo">
            <PhoneField value={d.altNo} onChange={(v) => set("altNo", v)} />
          </Field>
          <Field label="Work email" required eyeKey="work_email" vis={vis} onToggleVis={toggleVis} error={errFor("workEmail") ?? validateField("workEmail", d.workEmail)} dataKey="workEmail">
            <input type="email" className={`${cls.input} ${errorKey === "workEmail" ? cls.errorRing : ""}`} value={d.workEmail} onChange={(e) => set("workEmail", e.target.value)} autoComplete="email" />
          </Field>
        </Accordion>

        {/* ── 4. Work Address (11) ── */}
        <Accordion index={3} title={SECTIONS[3]} filled={stats[3][0]} total={stats[3][1]} open={open.has(3)} onToggle={() => toggle(3)}>
          <div className="flex items-center justify-end"><EyeBtn on={isFieldVisible(vis, "work_address")} onToggle={() => toggleVis("work_address")} label="Work address" /></div>
          <div data-field="workAddress" className={errorKey === "workAddress" ? "rounded-2xl p-1 ring-4 ring-red/25" : ""}>
            <AddressFields value={d.workAddress} onChange={(k, v) => setAddr("workAddress", k, v)} linesRequired />
          </div>
        </Accordion>

        {/* ── 5. Home Address (12–13) ── */}
        <Accordion index={4} title={SECTIONS[4]} filled={stats[4][0]} total={stats[4][1]} open={open.has(4)} onToggle={() => toggle(4)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {([["enter", "Enter home address"], ["same", "Same as above"], ["none", "Do not wish to provide"]] as const).map(([m, lbl]) => (
                <button key={m} type="button" onClick={() => { setHomeMode(m); if (m === "same") copyFromWork("homeAddress"); }} className={cls.segBtn(homeMode === m)}>{lbl}</button>
              ))}
            </div>
            {homeMode !== "none" && <EyeBtn on={isFieldVisible(vis, "home_address")} onToggle={() => toggleVis("home_address")} label="Home address" />}
          </div>
          {homeMode === "enter" && <AddressFields value={d.homeAddress} onChange={(k, v) => setAddr("homeAddress", k, v)} />}
          {homeMode === "same" && <div className="rounded-xl border border-hairline bg-surface-sunk/50 px-4 py-3 text-[14px] text-ink-muted">Using your work address as your home address.</div>}
          {homeMode === "none" && <div className="rounded-xl border border-hairline bg-surface-sunk/50 px-4 py-3 text-[14px] text-ink-muted">No home address will be saved.</div>}
          <Field label="Personal email" eyeKey="personal_email" vis={vis} onToggleVis={toggleVis} error={validateField("personalEmail", d.personalEmail)}>
            <input type="email" className={cls.input} value={d.personalEmail} onChange={(e) => set("personalEmail", e.target.value)} />
          </Field>
        </Accordion>

        {/* ── 6. Factory / Warehouse / Satellite Address (14) ── */}
        <Accordion index={5} title={SECTIONS[5]} filled={stats[5][0]} total={stats[5][1]} open={open.has(5)} onToggle={() => toggle(5)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {([["enter", "Enter address"], ["same", "Same as above"], ["none", "Do not wish to provide"]] as const).map(([m, lbl]) => (
                <button key={m} type="button" onClick={() => { setFactoryMode(m); if (m === "same") copyFromWork("factoryAddress"); }} className={cls.segBtn(factoryMode === m)}>{lbl}</button>
              ))}
            </div>
            {factoryMode !== "none" && <EyeBtn on={isFieldVisible(vis, "factory_address")} onToggle={() => toggleVis("factory_address")} label="Factory address" />}
          </div>
          {factoryMode === "enter" && <AddressFields value={d.factoryAddress} onChange={(k, v) => setAddr("factoryAddress", k, v)} />}
          {factoryMode === "same" && <div className="rounded-xl border border-hairline bg-surface-sunk/50 px-4 py-3 text-[14px] text-ink-muted">Using your work address here.</div>}
          {factoryMode === "none" && <div className="rounded-xl border border-hairline bg-surface-sunk/50 px-4 py-3 text-[14px] text-ink-muted">No factory / warehouse address will be saved.</div>}
        </Accordion>

        {/* ── 7. Business Profile (15–23) ── */}
        <Accordion index={6} title={SECTIONS[6]} filled={stats[6][0]} total={stats[6][1]} open={open.has(6)} onToggle={() => toggle(6)}>
          <Field label="Company website" error={validateField("companyWebsite", d.companyWebsite)}>
            <input className={cls.input} value={d.companyWebsite} onChange={(e) => set("companyWebsite", e.target.value)} placeholder="www.example.com" />
          </Field>
          <Field label="Nature of your business (products / services / solutions)">
            <textarea className={cls.area} value={d.natureOfBusiness} onChange={(e) => set("natureOfBusiness", e.target.value)} placeholder="What you make, sell or solve…" />
          </Field>
          <Field label="Your biggest USP / why people should come to you">
            <textarea className={cls.area} value={d.usp} onChange={(e) => set("usp", e.target.value)} />
          </Field>
          {renderAttachments("Digital brochures (PDF / image · max 5)", "Upload from your device. Maximum 5.", BROCHURE_KINDS, "brochure")}
          {renderAttachments("Product / service videos (links / PDF / image · max 5)", "Paste a link, or upload. Maximum 5.", VIDEO_KINDS, "video")}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Business category" required error={errFor("category")} dataKey="category">
              <ComboInput className={`${cls.input} ${errorKey === "category" ? cls.errorRing : ""}`} options={categories} placeholder="Select or search category" value={d.category} onChange={(v) => set("category", v)} />
            </Field>
            <Field label="Industry / sector" required error={errFor("industry")} dataKey="industry">
              <ComboInput className={`${cls.input} ${errorKey === "industry" ? cls.errorRing : ""}`} options={industries} placeholder="Select or search industry" value={d.industry} onChange={(v) => set("industry", v)} />
            </Field>
          </div>
          <Field label="Best time to connect" hint={BEST_TIME_PLACEHOLDER}>
            <BestTimePicker value={d.bestTime} onChange={(v) => set("bestTime", v)} />
          </Field>
          <Field label="Best mode to connect" required error={errFor("bestModes")} dataKey="bestModes">
            <div className={`flex flex-wrap gap-2 ${errorKey === "bestModes" ? "rounded-xl p-1 ring-4 ring-red/25" : ""}`}>
              {CONNECT_MODES.map((m) => (
                <button key={m.value} type="button" onClick={() => toggleMode(m.value)} aria-pressed={d.bestModes.includes(m.value)} className={cls.segBtn(d.bestModes.includes(m.value))}>{m.label}</button>
              ))}
            </div>
          </Field>
        </Accordion>

        {/* ── 8. Social & Digital Presence (24–28) ── */}
        <Accordion index={7} title={SECTIONS[7]} filled={stats[7][0]} total={stats[7][1]} open={open.has(7)} onToggle={() => toggle(7)}>
          <SocialRow icon={Icon.link} label="LinkedIn profile" value={d.linkedin} onChange={(v) => set("linkedin", v)} placeholder="linkedin.com/in/username" eyeKey="linkedin" vis={vis} onToggleVis={toggleVis} />
          <SocialRow icon={Icon.link} label="Business Instagram handle" value={d.businessInstagram} onChange={(v) => set("businessInstagram", v)} placeholder="@brand" eyeKey="business_instagram" vis={vis} onToggleVis={toggleVis} />
          <SocialRow icon={Icon.link} label="Personal Instagram handle" value={d.personalInstagram} onChange={(v) => set("personalInstagram", v)} placeholder="@you" eyeKey="personal_instagram" vis={vis} onToggleVis={toggleVis} />
          <SocialRow icon={Icon.link} label="YouTube channel" value={d.youtube} onChange={(v) => set("youtube", v)} placeholder="youtube.com/@channel" />
          <Field label="WhatsApp connect — DM from our portal" required eyeKey="whatsapp" vis={vis} onToggleVis={toggleVis}>
            <div className="flex gap-2">
              {DM_PREF.map((p) => (
                <button key={p.value} type="button" onClick={() => set("whatsappDmPref", p.value)} className={cls.segBtn(d.whatsappDmPref === p.value)}>{p.label}</button>
              ))}
            </div>
          </Field>
        </Accordion>

        {/* ── 9. Batch Information (29–30) — admin-filled ── */}
        <Accordion index={8} title={SECTIONS[8]} filled={stats[8][0]} total={stats[8][1]} open={open.has(8)} onToggle={() => toggle(8)}>
          {!canEditBatches && <p className="rounded-xl border border-hairline bg-surface-sunk/50 px-4 py-3 text-[13px] text-ink-muted">These batch numbers are filled by the Altus admin team.</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="PS batch no"><input className={cls.input} value={d.psBatch} readOnly={!canEditBatches} onChange={(e) => set("psBatch", e.target.value)} placeholder="PS-12" /></Field>
            <Field label="CQ batch no"><input className={cls.input} value={d.cqBatch} readOnly={!canEditBatches} onChange={(e) => set("cqBatch", e.target.value)} placeholder="CQ-07" /></Field>
            <Field label="BSS batch no"><input className={cls.input} value={d.bssBatch} readOnly={!canEditBatches} onChange={(e) => set("bssBatch", e.target.value)} placeholder="BSS-03" /></Field>
          </div>
        </Accordion>

        {/* ── 10. Personal Details (31–36) ── */}
        <Accordion index={9} title={SECTIONS[9]} filled={stats[9][0]} total={stats[9][1]} open={open.has(9)} onToggle={() => toggle(9)}>
          <Field label="Areas of interest" eyeKey="areas_of_interest" vis={vis} onToggleVis={toggleVis}>
            <textarea className={cls.area} value={d.areasOfInterest} onChange={(e) => set("areasOfInterest", e.target.value)} placeholder="Sustainability, Manufacturing, B2B exports…" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Birth date" required eyeKey="birth_date" vis={vis} onToggleVis={toggleVis} error={errFor("birthDate")} dataKey="birthDate">
              <input type="date" max={new Date().toISOString().slice(0, 10)} className={`${cls.input} ${errorKey === "birthDate" ? cls.errorRing : ""}`} value={d.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
            </Field>
            <Field label="Blood group" required error={errFor("bloodGroup")} dataKey="bloodGroup">
              <select className={`${cls.input} ${errorKey === "bloodGroup" ? cls.errorRing : ""}`} value={d.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
                <option value="">Select</option>
                {BLOOD.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Marital status" eyeKey="marital_status" vis={vis} onToggleVis={toggleVis}>
            <RadioGroup value={d.maritalStatus} options={MARITAL} onChange={(v) => set("maritalStatus", v)} />
          </Field>
          <Field label="Marriage anniversary date" eyeKey="anniversary" vis={vis} onToggleVis={toggleVis}>
            <input type="date" className={cls.input} value={d.anniversary} onChange={(e) => set("anniversary", e.target.value)} />
          </Field>
          <Field label="Your biography">
            <textarea className={cls.area} value={d.about} onChange={(e) => set("about", e.target.value)} placeholder="Write whatever you'd like the Tribe to know…" />
          </Field>
        </Accordion>

        {/* ── 11. Professional Network (37–39) ── */}
        <Accordion index={10} title={SECTIONS[10]} filled={stats[10][0]} total={stats[10][1]} open={open.has(10)} onToggle={() => toggle(10)}>
          <Field label="Network groups / trade associations / forums you're affiliated with" hint="Eg: BNI Premiere, Ascent Imperium, etc." eyeKey="network_groups" vis={vis} onToggleVis={toggleVis}>
            <ChipInput value={d.networkGroups} onChange={(v) => set("networkGroups", v)} placeholder="Eg: BNI Premiere, Ascent Imperium" />
          </Field>
          <Field label="Companies / people you can connect to" hint="Eg: Hindustan Lever – Mr. Amit Shah – Director Purchase" eyeKey="can_connect" vis={vis} onToggleVis={toggleVis}>
            <ChipInput value={d.canConnect} onChange={(v) => set("canConnect", v)} placeholder="Eg: Hindustan Lever – Mr. Amit Shah – Director Purchase" />
          </Field>
          <Field label="Companies / people you want to get connected with" hint="Eg: Hindustan Lever – Mr. Amit Shah – Director Purchase" eyeKey="want_connect" vis={vis} onToggleVis={toggleVis}>
            <ChipInput value={d.wantConnect} onChange={(v) => set("wantConnect", v)} placeholder="Eg: Hindustan Lever – Mr. Amit Shah – Director Purchase" />
          </Field>
        </Accordion>

        {/* ── 12. Altus Experience (40–43) ── */}
        <Accordion index={11} title={SECTIONS[11]} filled={stats[11][0]} total={stats[11][1]} open={open.has(11)} onToggle={() => toggle(11)}>
          <Field label="How did Manan Vasa's programs benefit you at work">
            <textarea className={cls.area} value={d.programBenefitWork} onChange={(e) => set("programBenefitWork", e.target.value)} />
          </Field>
          <Field label="How did Manan Vasa's programs benefit you in personal life">
            <textarea className={cls.area} value={d.programBenefitPersonal} onChange={(e) => set("programBenefitPersonal", e.target.value)} />
          </Field>
          <Field label="Your favourite tool" hint={`Select up to 3 · ${tools.length}/3 selected`}>
            <div className="flex flex-wrap gap-2">
              {TOOLS.map((t) => {
                const on = tools.includes(t);
                const disabled = !on && tools.length >= 3;
                return <button key={t} type="button" disabled={disabled} onClick={() => toggleTool(t)} aria-pressed={on} className={cls.segBtn(on) + " disabled:opacity-40 disabled:cursor-not-allowed"}>{t}</button>;
              })}
            </div>
          </Field>
          <Field label="Your purpose / success mantra / philosophy in life">
            <textarea className={cls.area} value={d.purpose} onChange={(e) => set("purpose", e.target.value)} />
          </Field>
        </Accordion>

        {/* ── 13. Community & Tribe Participation (44–48) ── */}
        <Accordion index={12} title={SECTIONS[12]} filled={stats[12][0]} total={stats[12][1]} open={open.has(12)} onToggle={() => toggle(12)}>
          <Field label="Would you be interested in assisting / helping others in Altus Tribe" eyeKey="interested_helping" vis={vis} onToggleVis={toggleVis}>
            <RadioGroup value={d.interestedHelping} options={YES_NO_MAYBE} onChange={(v) => set("interestedHelping", v)} />
          </Field>
          <Field label="How can you contribute to this Tribe?" eyeKey="contribution" vis={vis} onToggleVis={toggleVis}>
            <textarea className={cls.area} value={d.contribution} onChange={(e) => set("contribution", e.target.value)} />
          </Field>
          <Field label="Would you be interested in coaching / mentoring others?" eyeKey="interested_coaching" vis={vis} onToggleVis={toggleVis}>
            <RadioGroup value={d.interestedCoaching} options={YES_NO_MAYBE} onChange={(v) => set("interestedCoaching", v)} />
          </Field>
          <Field label="Would you be interested in business networking?" eyeKey="interested_networking" vis={vis} onToggleVis={toggleVis}>
            <RadioGroup value={d.interestedNetworking} options={NETWORK_PREF} onChange={(v) => set("interestedNetworking", v)} />
          </Field>
          <Field label="No. of conclaves attended" hint="Auto-generated from Altus records.">
            <input className={cls.input + " bg-surface-sunk/60"} value={d.conclavesAttended} readOnly />
          </Field>
        </Accordion>
      </div>
    </div>
  );
});

// ─── File attachment upload control ─────────────────────────────────────────
function FileUpload({ filePath, onFile, onClear }: { filePath: string; onFile: (f: File) => Promise<void>; onClear: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    if (f.size > MAX_PHOTO_BYTES) { setErr(PHOTO_TOO_LARGE_MSG); return; }
    setBusy(true);
    try { await onFile(f); } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed."); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-1.5">
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-white px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-hairline-bright disabled:opacity-60">{Icon.upload}{busy ? "Uploading…" : filePath ? "Replace file" : "Upload file"}</button>
        {filePath && <button type="button" onClick={onClear} className="text-[13px] text-ink-muted transition-colors hover:text-red">Remove</button>}
      </div>
      {filePath && <p className="truncate text-[12px] text-ink-muted">Uploaded: {filePath.split("/").pop()}</p>}
      {err && <p className="text-[12px] text-red">{err}</p>}
    </div>
  );
}

export default ProfileForm;
