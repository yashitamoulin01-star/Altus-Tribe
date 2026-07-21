"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveProfile } from "@/app/(app)/account/edit/actions";
import { finishOnboarding } from "./actions";
import { uploadFile } from "@/lib/storage-client";
import LegalModal, { type LegalDocType } from "@/components/LegalModal";
import {
  ATTACHMENT_KIND_LABELS,
  composeFullName,
  computeProfileCompletion,
  CONNECT_MODES,
  isFieldVisible,
  isFileKind,
  MAX_ATTACHMENTS,
  validateField,
  VISIBILITY_FIELDS,
  type AttachmentKind,
  type EditableAddress,
  type EditableAttachment,
  type EditableProfile,
  type FieldVisibility,
} from "@/lib/profile-fields";

// ---------------------------------------------------------------------------
// 13-screen conversational onboarding (PRD Sheet-2). Collects all 48 PRD fields
// over focused sections, on the shared EditableProfile model + saveProfile, with
// debounced autosave, resume, live validation, progress, and per-field privacy.
// Function-first: clean + consistent + mobile-first, no premium polish yet.
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
const FIRST_CONTENT = 1; // Personal
const LAST_CONTENT = 11; // Review
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

const input =
  "w-full rounded-lg border border-hairline bg-surface-sunk px-4 py-3 text-[16px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-red/30";
const area = input + " min-h-[110px] leading-relaxed resize-y";
const lbl = "mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted";

// --- small field primitives ------------------------------------------------

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={lbl}>{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-[12px] text-ink-muted">{hint}</span>}
      {error && <span className="mt-1 block text-[13px] text-red">{error}</span>}
    </label>
  );
}

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
      {options.map((o) => {
        const on = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(on ? "" : o)}
            aria-pressed={on}
            className={`rounded-lg border px-3.5 py-2 text-[14px] transition-colors ${
              on ? "border-red bg-red/10 text-red" : "border-hairline text-ink-muted hover:border-ink-muted"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Screen({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.015em] text-ink sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">{intro}</p>
      <div className="mt-7 space-y-5">{children}</div>
    </div>
  );
}

// --- component -------------------------------------------------------------

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

  const firstRender = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced autosave whenever data/vis/step change (skip Welcome + Completion).
  useEffect(() => {
    if (!configured || step < FIRST_CONTENT || step > LAST_CONTENT) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveProfile(d, vis, undefined, step).then((r) =>
        setSaveState(r.ok ? "saved" : "error"),
      );
    }, 900);
    return () => clearTimeout(timer.current);
  }, [d, vis, step, configured]);

  const completion = computeProfileCompletion(d);
  const set = <K extends keyof EditableProfile>(k: K, v: EditableProfile[K]) => {
    setD((p) => ({ ...p, [k]: v }));
    setSaveState("idle");
  };
  const setAddr = (
    which: "workAddress" | "homeAddress" | "factoryAddress",
    k: keyof EditableAddress,
    v: string,
  ) => setD((p) => ({ ...p, [which]: { ...p[which], [k]: v } }));
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

  // Uploads
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

  const eye = (key: string) => (
    <button
      type="button"
      onClick={() => toggleVis(key)}
      className={`font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
        isFieldVisible(vis, key) ? "text-ink" : "text-ink-muted"
      }`}
      title={isFieldVisible(vis, key) ? "Shown — click to hide" : "Hidden — click to show"}
    >
      {isFieldVisible(vis, key) ? "◉ Shown" : "○ Hidden"}
    </button>
  );

  return (
    <main className="mx-auto w-full max-w-[640px] flex-1 px-5 py-8 sm:px-8 sm:py-12">
      {/* Progress (hidden on welcome + completion) */}
      {step >= FIRST_CONTENT && step <= LAST_CONTENT && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              Step {step} of {LAST_CONTENT} · {SCREENS[step]}
            </p>
            <span className="font-mono text-[11px] tabular-nums text-ink-muted">{completion}% complete</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-sunk">
            <div className="h-full rounded-full bg-red transition-[width] duration-300" style={{ width: `${completion}%` }} />
          </div>
          <p className="mt-2 h-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            {!configured
              ? "Preview mode — connect Supabase to save."
              : saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                  ? "✓ Saved"
                  : saveState === "error"
                    ? "Couldn't save — check your connection"
                    : ""}
          </p>
        </div>
      )}

      {/* ---- Screen 0: Welcome ---- */}
      {step === 0 && (
        <div className="py-6">
          <p className="kicker mb-4">Welcome to Altus Tribe</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">
            Let&apos;s build your identity.
          </h1>
          <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-ink-secondary">
            We&apos;ll walk through your profile together — personal, business, contact,
            portfolio and networking. It takes about 4–5 minutes, and every answer
            saves automatically, so you can stop and resume anytime.
          </p>
          <button
            type="button"
            onClick={next}
            className="mt-8 rounded-lg bg-red px-7 py-3 text-[16px] font-medium text-paper transition-colors hover:bg-red-hover"
          >
            {initialStep > FIRST_CONTENT ? "Resume →" : "Start →"}
          </button>
        </div>
      )}

      {/* ---- Step 1: Personal ---- */}
      {step === 1 && (
        <Screen title="Let's know you." intro="Start with the human behind the business.">
          <ImagePicker
            label="Profile photo"
            value={d.photoUrl}
            configured={configured}
            aspect="aspect-[4/5]"
            onUrl={(v) => set("photoUrl", v)}
            onFile={(f) => uploadImage("photoUrl", f)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="First name"><input className={input} value={d.firstName} onChange={(e) => set("firstName", e.target.value.toUpperCase())} placeholder="YASHITA" /></Field>
            <Field label="Middle name"><input className={input} value={d.middleName} onChange={(e) => set("middleName", e.target.value.toUpperCase())} /></Field>
            <Field label="Last name"><input className={input} value={d.lastName} onChange={(e) => set("lastName", e.target.value.toUpperCase())} placeholder="MOULI" /></Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Birth date">
              <div className="flex items-center gap-2">
                <input type="date" className={input} value={d.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
                {eye("birth_date")}
              </div>
            </Field>
            <Field label="Blood group">
              <select className={input} value={d.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
                <option value="">—</option>
                {BLOOD.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Marital status">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-ink-muted">Privacy</span>
              {eye("marital_status")}
            </div>
            <div className="mt-1.5"><Segmented value={d.maritalStatus} options={MARITAL} onChange={(v) => set("maritalStatus", v)} /></div>
          </Field>
          <Field label="Marriage anniversary">
            <div className="flex items-center gap-2">
              <input type="date" className={input} value={d.anniversary} onChange={(e) => set("anniversary", e.target.value)} />
              {eye("anniversary")}
            </div>
          </Field>
          <Field label="Biography" hint="Write freely — what you left, what you're building, and why it matters.">
            <textarea className={area} value={d.about} onChange={(e) => set("about", e.target.value)} />
          </Field>
        </Screen>
      )}

      {/* ---- Step 2: Business ---- */}
      {step === 2 && (
        <Screen title="Your business identity." intro="How the Tribe will recognise your work.">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="sm:w-40">
              <ImagePicker label="Company logo" value={d.companyLogoUrl} configured={configured} aspect="aspect-square" onUrl={(v) => set("companyLogoUrl", v)} onFile={(f) => uploadImage("companyLogoUrl", f)} />
            </div>
            <div className="flex-1 space-y-4">
              <Field label="Business name"><input className={input} value={d.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="GreenWrap Industries" /></Field>
              <Field label="Brand names" hint="Comma separated, if you run more than one."><input className={input} value={d.brandNames} onChange={(e) => set("brandNames", e.target.value)} /></Field>
            </div>
          </div>
          <Field label="Website" error={validateField("companyWebsite", d.companyWebsite)}><input className={input} value={d.companyWebsite} onChange={(e) => set("companyWebsite", e.target.value)} placeholder="www.example.com" /></Field>
          <Field label="Nature of your business" hint="Products / Services / Solutions — describe what you offer."><textarea className={area} value={d.natureOfBusiness} onChange={(e) => set("natureOfBusiness", e.target.value)} /></Field>
          <Field label="Your biggest USP" hint="Why should people come to you?"><textarea className={area} value={d.usp} onChange={(e) => set("usp", e.target.value)} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Business category">
              <select className={input} value={d.category} onChange={(e) => set("category", e.target.value)}>
                <option value="">—</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Industry / sector">
              <select className={input} value={d.industry} onChange={(e) => set("industry", e.target.value)}>
                <option value="">—</option>
                {industries.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
          </div>
        </Screen>
      )}

      {/* ---- Step 3: Contact ---- */}
      {step === 3 && (
        <Screen title="How to reach you." intro="Members connect through these. Toggle privacy on any of them.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Mobile" error={validateField("cellNo", d.cellNo)}>
              <div className="flex items-center gap-2"><input inputMode="numeric" className={input} value={d.cellNo} onChange={(e) => set("cellNo", e.target.value.replace(/[^0-9]/g, ""))} placeholder="10-digit" />{eye("cell_no")}</div>
            </Field>
            <Field label="Alternate mobile" error={validateField("altNo", d.altNo)}>
              <div className="flex items-center gap-2"><input inputMode="numeric" className={input} value={d.altNo} onChange={(e) => set("altNo", e.target.value.replace(/[^0-9]/g, ""))} placeholder="10-digit" />{eye("alt_no")}</div>
            </Field>
            <Field label="Work email" error={validateField("workEmail", d.workEmail)}>
              <div className="flex items-center gap-2"><input type="email" className={input} value={d.workEmail} onChange={(e) => set("workEmail", e.target.value)} />{eye("work_email")}</div>
            </Field>
            <Field label="Personal email" error={validateField("personalEmail", d.personalEmail)}>
              <div className="flex items-center gap-2"><input type="email" className={input} value={d.personalEmail} onChange={(e) => set("personalEmail", e.target.value)} />{eye("personal_email")}</div>
            </Field>
          </div>
          <Field label="Best time to connect" hint="e.g. 10am–7pm, Mon–Fri"><input className={input} value={d.bestTime} onChange={(e) => set("bestTime", e.target.value)} /></Field>
          <Field label="Best mode to connect">
            <div className="flex flex-wrap gap-2">
              {CONNECT_MODES.map((m) => {
                const on = d.bestModes.includes(m.value);
                return <button key={m.value} type="button" onClick={() => toggleMode(m.value)} aria-pressed={on} className={`rounded-lg border px-3.5 py-2 text-[14px] transition-colors ${on ? "border-red bg-red/10 text-red" : "border-hairline text-ink-muted hover:border-ink-muted"}`}>{m.label}</button>;
              })}
            </div>
          </Field>
          <label className="flex items-center justify-between rounded-lg border border-hairline px-4 py-3">
            <span className="text-[15px] text-ink">Allow WhatsApp DM from the portal</span>
            <span className="flex items-center gap-3">{eye("whatsapp")}<input type="checkbox" checked={d.whatsappDm} onChange={(e) => set("whatsappDm", e.target.checked)} className="h-4 w-4 accent-[var(--color-red)]" /></span>
          </label>
        </Screen>
      )}

      {/* ---- Steps 4/5/6: Addresses ---- */}
      {step === 4 && (
        <Screen title="Business address." intro="Where your work happens.">
          <div className="flex justify-end">{eye("work_address")}</div>
          <AddressFields value={d.workAddress} onChange={(k, v) => setAddr("workAddress", k, v)} />
        </Screen>
      )}
      {step === 5 && (
        <Screen title="Home address." intro="Optional — kept private unless you choose to show it.">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => copyFromWork("homeAddress")} className="rounded-lg border border-hairline px-3.5 py-2 text-[14px] text-ink-muted transition-colors hover:border-ink-muted hover:text-ink">✔ Same as business address</button>
            {eye("home_address")}
          </div>
          <AddressFields value={d.homeAddress} onChange={(k, v) => setAddr("homeAddress", k, v)} />
        </Screen>
      )}
      {step === 6 && (
        <Screen title="Factory / warehouse address." intro="Optional — add if it's separate from your office.">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => copyFromWork("factoryAddress")} className="rounded-lg border border-hairline px-3.5 py-2 text-[14px] text-ink-muted transition-colors hover:border-ink-muted hover:text-ink">✔ Same as business address</button>
            {eye("factory_address")}
          </div>
          <AddressFields value={d.factoryAddress} onChange={(k, v) => setAddr("factoryAddress", k, v)} />
        </Screen>
      )}

      {/* ---- Step 7: Portfolio ---- */}
      {step === 7 && (
        <Screen title="Your showcase." intro="Brochures, videos and your channels. Up to 5 attachments.">
          <div className="space-y-3">
            {d.attachments.map((a, i) => (
              <div key={i} className="rounded-lg border border-hairline p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <select className={input + " max-w-[160px]"} value={a.kind} onChange={(e) => patchAttachment(i, { kind: e.target.value as AttachmentKind, url: "", filePath: "" })}>
                    {(Object.keys(ATTACHMENT_KIND_LABELS) as AttachmentKind[]).map((k) => <option key={k} value={k}>{ATTACHMENT_KIND_LABELS[k]}</option>)}
                  </select>
                  <button type="button" onClick={() => removeAttachment(i)} className="text-[13px] text-ink-muted transition-colors hover:text-red">Remove</button>
                </div>
                <input className={input} placeholder="Title" value={a.title} onChange={(e) => patchAttachment(i, { title: e.target.value })} />
                <div className="mt-2">
                  {isFileKind(a.kind) ? (
                    <AttachmentFile filePath={a.filePath} configured={configured} onFile={(f) => uploadAttachment(i, f)} onPath={(v) => patchAttachment(i, { filePath: v })} onClear={() => patchAttachment(i, { filePath: "" })} />
                  ) : (
                    <input className={input} placeholder="https://…" value={a.url} onChange={(e) => patchAttachment(i, { url: e.target.value })} />
                  )}
                </div>
              </div>
            ))}
          </div>
          {d.attachments.length < MAX_ATTACHMENTS && (
            <button type="button" onClick={addAttachment} className="rounded-lg border border-dashed border-hairline px-4 py-2.5 text-[14px] text-ink-muted transition-colors hover:border-ink-muted hover:text-ink">+ Add brochure or video</button>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="LinkedIn"><div className="flex items-center gap-2"><input className={input} value={d.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/you" />{eye("linkedin")}</div></Field>
            <Field label="YouTube"><input className={input} value={d.youtube} onChange={(e) => set("youtube", e.target.value)} /></Field>
            <Field label="Business Instagram"><div className="flex items-center gap-2"><input className={input} value={d.businessInstagram} onChange={(e) => set("businessInstagram", e.target.value)} />{eye("business_instagram")}</div></Field>
            <Field label="Personal Instagram"><div className="flex items-center gap-2"><input className={input} value={d.personalInstagram} onChange={(e) => set("personalInstagram", e.target.value)} />{eye("personal_instagram")}</div></Field>
          </div>
        </Screen>
      )}

      {/* ---- Step 8: Networking ---- */}
      {step === 8 && (
        <Screen title="How you network." intro="Help the Tribe make the right introductions.">
          <Field label="Areas of interest"><div className="flex items-start gap-2"><textarea className={area} value={d.areasOfInterest} onChange={(e) => set("areasOfInterest", e.target.value)} />{eye("areas_of_interest")}</div></Field>
          <Field label="Expertise" hint="Comma separated.">
            <input className={input} value={d.expertise.join(", ")} placeholder="Manufacturing, Exports, B2B Sales" onChange={(e) => set("expertise", e.target.value.split(",").map((s) => s.trimStart()))} onBlur={(e) => set("expertise", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </Field>
          <Field label="Associations & forums" hint="e.g. BNI Premiere, Ascent Imperium"><div className="flex items-start gap-2"><textarea className={area} value={d.networkGroups} onChange={(e) => set("networkGroups", e.target.value)} />{eye("network_groups")}</div></Field>
          <Field label="Companies / people you can connect others to"><div className="flex items-start gap-2"><textarea className={area} value={d.canConnect} onChange={(e) => set("canConnect", e.target.value)} />{eye("can_connect")}</div></Field>
          <Field label="Companies / people you want to connect with"><div className="flex items-start gap-2"><textarea className={area} value={d.wantConnect} onChange={(e) => set("wantConnect", e.target.value)} />{eye("want_connect")}</div></Field>
          <Field label="Favourite productivity tools" hint={`Pick up to 3 · ${tools.length}/3 selected`}>
            <div className="flex flex-wrap gap-2">
              {TOOLS.map((t) => {
                const on = tools.includes(t);
                const disabled = !on && tools.length >= 3;
                return <button key={t} type="button" disabled={disabled} onClick={() => toggleTool(t)} aria-pressed={on} className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors disabled:opacity-40 ${on ? "border-red bg-red/10 text-red" : "border-hairline text-ink-muted hover:border-ink-muted"}`}>{t}</button>;
              })}
            </div>
          </Field>
          <Field label="Your purpose / success philosophy"><textarea className={area} value={d.purpose} onChange={(e) => set("purpose", e.target.value)} /></Field>
        </Screen>
      )}

      {/* ---- Step 9: Community ---- */}
      {step === 9 && (
        <Screen title="Giving back." intro="How you'd like to contribute to the Tribe.">
          <Field label="Interested in helping / assisting others?">
            <Segmented value={d.interestedHelping} options={YES_NO_MAYBE} onChange={(v) => set("interestedHelping", v)} />
          </Field>
          <Field label="How can you contribute to this Tribe?"><div className="flex items-start gap-2"><textarea className={area} value={d.contribution} onChange={(e) => set("contribution", e.target.value)} />{eye("contribution")}</div></Field>
          <Field label="Interested in coaching / mentoring others?"><Segmented value={d.interestedCoaching} options={YES_NO_MAYBE} onChange={(v) => set("interestedCoaching", v)} /></Field>
          <Field label="Interested in business networking?"><Segmented value={d.interestedNetworking} options={NETWORK_PREF} onChange={(v) => set("interestedNetworking", v)} /></Field>
          <Field label="How did Manan's programs benefit you at work?"><textarea className={area} value={d.programBenefitWork} onChange={(e) => set("programBenefitWork", e.target.value)} /></Field>
          <Field label="How did they benefit you personally?"><textarea className={area} value={d.programBenefitPersonal} onChange={(e) => set("programBenefitPersonal", e.target.value)} /></Field>
        </Screen>
      )}

      {/* ---- Step 10: Privacy ---- */}
      {step === 10 && (
        <Screen title="Your privacy." intro="Choose who sees your feature, then fine-tune individual fields.">
          <Field label="Who can see your profile?">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { v: "public", t: "Public", h: "Anyone with the link" },
                { v: "tribe", t: "Members only", h: "Signed-in Tribe" },
                { v: "private", t: "Hidden", h: "Only you & admins" },
              ].map((o) => {
                const on = d.visibility === o.v;
                return (
                  <button key={o.v} type="button" onClick={() => set("visibility", o.v as EditableProfile["visibility"])} aria-pressed={on} className={`rounded-lg border px-4 py-3 text-left transition-colors ${on ? "border-red bg-red/5" : "border-hairline hover:border-ink-muted"}`}>
                    <p className={`text-[15px] font-medium ${on ? "text-red" : "text-ink"}`}>{o.t}</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">{o.h}</p>
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="border-t border-hairline pt-5">
            <p className={lbl}>Show or hide individual fields</p>
            <div className="mt-3 divide-y divide-hairline">
              {VISIBILITY_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center justify-between py-2.5">
                  <span className="text-[15px] text-ink">{f.label}</span>
                  {eye(f.key)}
                </div>
              ))}
            </div>
          </div>
        </Screen>
      )}

      {/* ---- Step 11: Review ---- */}
      {step === 11 && (
        <Screen title="Review your identity." intro="A quick look before you go live. Edit any section.">
          <ReviewGroup title="Personal" onEdit={() => goto(1)} rows={[
            ["Name", composeFullName(d) || "—"],
            ["Birth date", d.birthDate || "—"],
            ["Blood group", d.bloodGroup || "—"],
            ["Biography", trunc(d.about)],
          ]} />
          <ReviewGroup title="Business" onEdit={() => goto(2)} rows={[
            ["Business", d.businessName || "—"],
            ["Category", d.category || "—"],
            ["Industry", d.industry || "—"],
            ["USP", trunc(d.usp)],
          ]} />
          <ReviewGroup title="Contact" onEdit={() => goto(3)} rows={[
            ["Mobile", d.cellNo || "—"],
            ["Work email", d.workEmail || "—"],
            ["Best modes", d.bestModes.join(", ") || "—"],
          ]} />
          <ReviewGroup title="Portfolio" onEdit={() => goto(7)} rows={[
            ["Attachments", String(d.attachments.length)],
            ["LinkedIn", d.linkedin || "—"],
          ]} />
          <ReviewGroup title="Networking" onEdit={() => goto(8)} rows={[
            ["Interests", trunc(d.areasOfInterest)],
            ["Tools", d.favouriteTools || "—"],
          ]} />
          <div className="rounded-lg border border-hairline bg-surface-sunk px-4 py-3">
            <p className="text-[14px] text-ink">Profile completeness: <span className="font-semibold text-red">{completion}%</span></p>
            {completion < 100 && <p className="mt-1 text-[13px] text-ink-muted">You can submit now and complete the rest anytime from your profile.</p>}
          </div>

          {/* Legal Declarations for Onboarding Submission */}
          <div className="mt-5 space-y-3 border-t border-hairline pt-4 text-[13px] text-ink-secondary">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={certifyAccurate}
                onChange={(e) => setCertifyAccurate(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-hairline accent-[var(--color-red)] cursor-pointer"
              />
              <span>I certify that the information provided is accurate.</span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={understandDisplay}
                onChange={(e) => setUnderstandDisplay(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-hairline accent-[var(--color-red)] cursor-pointer"
              />
              <span>I understand my profile will be displayed according to my selected privacy settings.</span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeDeclaration}
                onChange={(e) => setAgreeDeclaration(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-hairline accent-[var(--color-red)] cursor-pointer"
              />
              <span>
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setLegalDoc("declaration")}
                  className="font-semibold text-ink underline transition-colors hover:text-red"
                >
                  ALTUS TRIBE Profile Declaration
                </button>
                .
              </span>
            </label>
          </div>
        </Screen>
      )}

      {/* ---- Step 12: Completion ---- */}
      {step === COMPLETION && (
        <div className="py-10 text-center">
          <p className="text-4xl">🎉</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-ink">Welcome to Altus Tribe.</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-secondary">
            {composeFullName(d) || "Your"} professional identity is ready.
          </p>
          {slug && configured && (
            <a href={`/m/${slug}`} className="mt-6 inline-block text-[15px] text-red transition-colors hover:text-red-hover">Preview your public feature →</a>
          )}
          <div className="mt-8">
            <button type="button" onClick={enter} disabled={finishing} className="rounded-lg bg-red px-7 py-3 text-[16px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-60">
              {finishing ? "…" : "Explore your community →"}
            </button>
          </div>
        </div>
      )}

      {/* Nav (content steps only) */}
      {step >= FIRST_CONTENT && step <= LAST_CONTENT && (
        <div className="mt-10 flex items-center justify-between">
          <button type="button" onClick={back} className="text-[15px] text-ink-muted transition-colors hover:text-ink">← Back</button>
          {step < LAST_CONTENT ? (
            <button type="button" onClick={next} className="rounded-lg bg-red px-7 py-3 text-[16px] font-medium text-paper transition-colors hover:bg-red-hover">Continue →</button>
          ) : (
            <button type="button" onClick={submit} disabled={finishing || !certifyAccurate || !understandDisplay || !agreeDeclaration} className="rounded-lg bg-red px-7 py-3 text-[16px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-60">{finishing ? "…" : "Submit & finish →"}</button>
          )}
        </div>
      )}
      <LegalModal type={legalDoc} onClose={() => setLegalDoc(null)} />
    </main>
  );
}

// --- helpers ---------------------------------------------------------------

function trunc(s: string, n = 60) {
  const t = s.trim();
  if (!t) return "—";
  return t.length > n ? t.slice(0, n) + "…" : t;
}

function AddressFields({
  value,
  onChange,
}: {
  value: EditableAddress;
  onChange: (k: keyof EditableAddress, v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <input className={input} placeholder="Line 1 — Unit / Floor / Plot" value={value.line1} onChange={(e) => onChange("line1", e.target.value)} />
      <input className={input} placeholder="Line 2 — Building / Unit name" value={value.line2} onChange={(e) => onChange("line2", e.target.value)} />
      <input className={input} placeholder="Line 3 — Street / Road" value={value.line3} onChange={(e) => onChange("line3", e.target.value)} />
      <input className={input} placeholder="Line 4 — Area / Sector" value={value.line4} onChange={(e) => onChange("line4", e.target.value)} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className={input} placeholder="Landmark" value={value.landmark} onChange={(e) => onChange("landmark", e.target.value)} />
        <input className={input} placeholder="City" value={value.city} onChange={(e) => onChange("city", e.target.value)} />
        <input className={input} placeholder="State" value={value.state} onChange={(e) => onChange("state", e.target.value)} />
        <input className={input} placeholder="Country" value={value.country} onChange={(e) => onChange("country", e.target.value)} />
        <input className={input} inputMode="numeric" placeholder="Pincode" value={value.pincode} onChange={(e) => onChange("pincode", e.target.value.replace(/[^0-9]/g, ""))} />
        <input className={input} placeholder="Google Maps link" value={value.mapLink} onChange={(e) => onChange("mapLink", e.target.value)} />
      </div>
    </div>
  );
}

function ImagePicker({
  label,
  value,
  configured,
  aspect,
  onUrl,
  onFile,
}: {
  label: string;
  value: string;
  configured: boolean;
  aspect: string;
  onUrl: (v: string) => void;
  onFile: (f: File) => Promise<void>;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      await onFile(f);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <span className={lbl}>{label}</span>
      <div className="flex items-start gap-4">
        <div className={`${aspect} w-20 shrink-0 overflow-hidden rounded-lg border border-hairline bg-surface-sunk`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-ink-muted">none</div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          {configured ? (
            <>
              <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="rounded-lg border border-hairline px-3.5 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted disabled:opacity-60">{busy ? "Uploading…" : value ? "Replace" : "Upload"}</button>
              {value && <button type="button" onClick={() => onUrl("")} className="ml-2 text-[13px] text-ink-muted transition-colors hover:text-red">Remove</button>}
              {err && <p className="text-[13px] text-red">{err}</p>}
            </>
          ) : (
            <input className={input} placeholder="https://…/image.jpg" value={value} onChange={(e) => onUrl(e.target.value)} />
          )}
        </div>
      </div>
    </div>
  );
}

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
    try {
      await onFile(f);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };
  if (!configured) {
    return <input className={input} placeholder="Storage path or URL" value={filePath} onChange={(e) => onPath(e.target.value)} />;
  }
  return (
    <div className="space-y-1.5">
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="rounded-lg border border-hairline px-3.5 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted disabled:opacity-60">{busy ? "Uploading…" : filePath ? "Replace file" : "Upload file"}</button>
        {filePath && <button type="button" onClick={onClear} className="text-[13px] text-ink-muted transition-colors hover:text-red">Remove</button>}
      </div>
      {filePath && <p className="truncate font-mono text-[11px] text-positive">✓ {filePath}</p>}
      {err && <p className="text-[13px] text-red">{err}</p>}
    </div>
  );
}

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
    <div className="rounded-lg border border-hairline p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">{title}</p>
        <button type="button" onClick={onEdit} className="text-[13px] text-red transition-colors hover:text-red-hover">Edit</button>
      </div>
      <dl className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 text-[14px]">
            <dt className="shrink-0 text-ink-muted">{k}</dt>
            <dd className="truncate text-right text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
