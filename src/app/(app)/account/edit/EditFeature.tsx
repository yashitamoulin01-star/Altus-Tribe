"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { saveProfile } from "./actions";
import { uploadFile } from "@/lib/storage-client";
import {
  ATTACHMENT_KIND_LABELS,
  composeFullName,
  CONNECT_MODES,
  isFieldVisible,
  isFileKind,
  MAX_ATTACHMENTS,
  validateField,
  type AttachmentKind,
  type EditableAddress,
  type EditableAttachment,
  type EditableProfile,
  type FieldVisibility,
} from "@/lib/profile-fields";

const fieldCls =
  "w-full rounded border border-hairline bg-surface-sunk px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-red/40";
const labelCls =
  "font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted";

// --- Module-scoped field primitives (defined once, so inputs keep focus) ---

function EyeToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
        on ? "text-ink" : "text-ink-muted"
      }`}
      title={on ? "Visible — click to hide" : "Hidden — click to show"}
    >
      {on ? "◉ Shown" : "○ Hidden"}
    </button>
  );
}

function FieldLabel({
  label,
  visOn,
  onToggleVis,
}: {
  label: string;
  visOn?: boolean;
  onToggleVis?: () => void;
}) {
  return (
    <span className="mb-1.5 flex items-center justify-between">
      <span className={labelCls}>{label}</span>
      {onToggleVis && <EyeToggle on={visOn ?? true} onClick={onToggleVis} />}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  visOn,
  onToggleVis,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string | null;
  visOn?: boolean;
  onToggleVis?: () => void;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} visOn={visOn} onToggleVis={onToggleVis} />
      <input
        type={type}
        className={fieldCls}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="mt-1 block text-[13px] text-red">{error}</span>}
    </label>
  );
}

function AreaField({
  label,
  value,
  onChange,
  placeholder,
  visOn,
  onToggleVis,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  visOn?: boolean;
  onToggleVis?: () => void;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} visOn={visOn} onToggleVis={onToggleVis} />
      <textarea
        className={fieldCls + " min-h-[92px] resize-y leading-relaxed"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className={labelCls + " mb-1.5 block"}>{label}</span>
      <select className={fieldCls} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-hairline pt-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {note && <p className="mt-1 text-[13px] text-ink-muted">{note}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// A full postal address block (used for work / home / factory).
function AddressBlock({
  value,
  onChange,
  visOn,
  onToggleVis,
}: {
  value: EditableAddress;
  onChange: (k: keyof EditableAddress, v: string) => void;
  visOn: boolean;
  onToggleVis: () => void;
}) {
  return (
    <>
      <div className="mb-1 flex justify-end">
        <EyeToggle on={visOn} onClick={onToggleVis} />
      </div>
      <input className={fieldCls} placeholder="Unit / Floor / Plot" value={value.line1} onChange={(e) => onChange("line1", e.target.value)} />
      <input className={fieldCls} placeholder="Building name" value={value.line2} onChange={(e) => onChange("line2", e.target.value)} />
      <input className={fieldCls} placeholder="Street / Road" value={value.line3} onChange={(e) => onChange("line3", e.target.value)} />
      <input className={fieldCls} placeholder="Area / Sector" value={value.line4} onChange={(e) => onChange("line4", e.target.value)} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className={fieldCls} placeholder="Landmark" value={value.landmark} onChange={(e) => onChange("landmark", e.target.value)} />
        <input className={fieldCls} placeholder="City" value={value.city} onChange={(e) => onChange("city", e.target.value)} />
        <input className={fieldCls} placeholder="State" value={value.state} onChange={(e) => onChange("state", e.target.value)} />
        <input className={fieldCls} placeholder="Country" value={value.country} onChange={(e) => onChange("country", e.target.value)} />
        <input className={fieldCls} placeholder="Pincode" value={value.pincode} onChange={(e) => onChange("pincode", e.target.value.replace(/[^0-9]/g, ""))} />
        <input className={fieldCls} placeholder="Google Maps link" value={value.mapLink} onChange={(e) => onChange("mapLink", e.target.value)} />
      </div>
    </>
  );
}

// A single image upload tile (member photo / company logo). Falls back to a
// URL field when storage isn't configured, so the composer works offline.
function ImageUpload({
  label,
  value,
  onChange,
  onUpload,
  configured,
  aspect,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload: (file: File) => Promise<void>;
  configured: boolean;
  aspect: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      await onUpload(file);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className={labelCls + " mb-1.5 block"}>{label}</span>
      <div className="flex items-start gap-4">
        <div className={`${aspect} w-20 shrink-0 overflow-hidden rounded border border-hairline bg-surface-sunk`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-ink-muted">
              none
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          {configured ? (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="rounded border border-hairline px-3 py-1.5 text-[13px] text-ink transition-colors hover:border-ink-muted disabled:opacity-60"
              >
                {busy ? "Uploading…" : value ? "Replace" : "Upload"}
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="ml-2 text-[13px] text-ink-muted transition-colors hover:text-red"
                >
                  Remove
                </button>
              )}
              {err && <p className="text-[13px] text-red">{err}</p>}
            </>
          ) : (
            <input
              className={fieldCls}
              placeholder="https://…/image.jpg"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Upload control for a file-based portfolio attachment (brochure / image).
// The stored value is a private storage path, so we show its status, not a link.
function AttachmentFile({
  filePath,
  onUpload,
  onClear,
}: {
  filePath: string;
  onUpload: (file: File) => Promise<void>;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      await onUpload(file);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded border border-hairline px-3 py-1.5 text-[13px] text-ink transition-colors hover:border-ink-muted disabled:opacity-60"
        >
          {busy ? "Uploading…" : filePath ? "Replace file" : "Upload file"}
        </button>
        {filePath && (
          <button
            type="button"
            onClick={onClear}
            className="text-[13px] text-ink-muted transition-colors hover:text-red"
          >
            Remove
          </button>
        )}
      </div>
      {filePath && (
        <p className="truncate font-mono text-[11px] text-positive">✓ {filePath}</p>
      )}
      {err && <p className="text-[13px] text-red">{err}</p>}
    </div>
  );
}

// --- The composer ---------------------------------------------------------

export default function EditFeature({
  initial,
  initialVisibility,
  slug,
  userId,
  industries,
  categories,
  configured,
  adminTargetId = null,
  backHref = "/account",
  backLabel = "Account",
  editingName,
}: {
  initial: EditableProfile;
  initialVisibility: FieldVisibility;
  slug: string | null;
  userId: string | null;
  industries: string[];
  categories: string[];
  configured: boolean;
  // When set, an admin is editing this member (P3): saves target that profile
  // and the back link returns to the admin detail rather than /account.
  adminTargetId?: string | null;
  backHref?: string;
  backLabel?: string;
  editingName?: string;
}) {
  const [d, setD] = useState<EditableProfile>(initial);
  const [vis, setVis] = useState<FieldVisibility>(initialVisibility);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pending, start] = useTransition();

  const set = <K extends keyof EditableProfile>(k: K, v: EditableProfile[K]) => {
    setD((p) => ({ ...p, [k]: v }));
    setStatus("idle");
  };
  const setAddr = (
    which: "workAddress" | "homeAddress" | "factoryAddress",
    k: keyof EditableAddress,
    v: string,
  ) => {
    setD((p) => ({ ...p, [which]: { ...p[which], [k]: v } }));
    setStatus("idle");
  };
  const toggleBestMode = (mode: string) =>
    set(
      "bestModes",
      d.bestModes.includes(mode)
        ? d.bestModes.filter((m) => m !== mode)
        : [...d.bestModes, mode],
    );
  const toggleVis = (key: string) =>
    setVis((v) => ({ ...v, [key]: !isFieldVisible(v, key) }));
  const visProps = (key: string) => ({
    visOn: isFieldVisible(vis, key),
    onToggleVis: () => toggleVis(key),
  });

  // Attachments (max 5) ----------------------------------------------------
  const addAttachment = () => {
    if (d.attachments.length >= MAX_ATTACHMENTS) return;
    set("attachments", [
      ...d.attachments,
      { kind: "brochure", title: "", url: "", filePath: "" },
    ]);
  };
  const updateAttachment = (i: number, patch: Partial<EditableAttachment>) =>
    set(
      "attachments",
      d.attachments.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    );
  const removeAttachment = (i: number) =>
    set("attachments", d.attachments.filter((_, idx) => idx !== i));

  // Storage uploads --------------------------------------------------------
  const uploadImage = async (field: "photoUrl" | "companyLogoUrl", file: File) => {
    if (!userId) throw new Error("Not signed in.");
    const r = await uploadFile("member-photos", userId, file);
    if (!r.ok) throw new Error(r.error);
    set(field, r.publicUrl ?? "");
  };
  const uploadAttachment = async (i: number, file: File) => {
    if (!userId) throw new Error("Not signed in.");
    const r = await uploadFile("work-files", userId, file);
    if (!r.ok) throw new Error(r.error);
    updateAttachment(i, { filePath: r.path });
  };

  const save = () =>
    start(async () => {
      const r = await saveProfile(d, vis, adminTargetId ?? undefined);
      if (r.ok) setStatus("saved");
      else {
        setStatus("error");
        setErrorMsg(r.error);
      }
    });

  const fullName = composeFullName(d) || "Your name";

  return (
    <main className="mx-auto w-full max-w-[1080px] flex-1 px-6 py-10 sm:px-10">
      <nav className="mb-8 flex items-center justify-between">
        <Link
          href={backHref}
          className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
        >
          ← {backLabel}
        </Link>
        {slug && configured && (
          <Link
            href={`/m/${slug}`}
            className="text-[14px] text-red transition-colors hover:text-red-hover"
          >
            View my feature →
          </Link>
        )}
      </nav>

      <header className="mb-8">
        {adminTargetId && (
          <div className="mb-4 flex items-center gap-3 rounded border border-red/30 bg-red/5 px-4 py-2.5">
            <span className="rounded bg-red/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-red">
              Admin edit
            </span>
            <p className="text-[14px] text-ink">
              You are editing{editingName ? ` ${editingName}` : " this member"}&apos;s
              profile on their behalf.
            </p>
          </div>
        )}
        <p className="kicker mb-3">Edit feature</p>
        <h1 className="text-3xl font-semibold tracking-[-0.015em] text-ink">
          {adminTargetId ? "Edit this member's feature." : "Compose your feature."}
        </h1>
        {!configured && (
          <p className="mt-3 text-[14px] text-ink-muted">
            Preview mode — connect Supabase to save changes.
          </p>
        )}
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          <Section title="Identity">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextField label="First name" value={d.firstName} onChange={(v) => set("firstName", v.toUpperCase())} placeholder="YASHITA" />
              <TextField label="Middle name" value={d.middleName} onChange={(v) => set("middleName", v.toUpperCase())} />
              <TextField label="Last name" value={d.lastName} onChange={(v) => set("lastName", v.toUpperCase())} placeholder="MOULI" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Role / title" value={d.roleTitle} onChange={(v) => set("roleTitle", v)} placeholder="Founder" />
              <TextField label="City" value={d.city} onChange={(v) => set("city", v)} placeholder="Mumbai" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="Industry / sector" value={d.industry} onChange={(v) => set("industry", v)} options={industries} />
              <SelectField label="Business category" value={d.category} onChange={(v) => set("category", v)} options={categories} />
            </div>
            <TextField label="Brand names (comma separated)" value={d.brandNames} onChange={(v) => set("brandNames", v)} />
          </Section>

          <Section title="Photo & logo" note={configured ? "JPG or PNG. Stored securely." : "Paste image URLs — connect Supabase to upload."}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ImageUpload
                label="Member photo"
                value={d.photoUrl}
                onChange={(v) => set("photoUrl", v)}
                onUpload={(f) => uploadImage("photoUrl", f)}
                configured={configured}
                aspect="aspect-[4/5]"
              />
              <ImageUpload
                label="Company logo"
                value={d.companyLogoUrl}
                onChange={(v) => set("companyLogoUrl", v)}
                onUpload={(f) => uploadImage("companyLogoUrl", f)}
                configured={configured}
                aspect="aspect-square"
              />
            </div>
          </Section>

          <Section title="Contact" note="Each field has a show/hide toggle.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Cell number" value={d.cellNo} onChange={(v) => set("cellNo", v)} placeholder="10-digit" error={validateField("cellNo", d.cellNo)} {...visProps("cell_no")} />
              <TextField label="Alternate number" value={d.altNo} onChange={(v) => set("altNo", v)} placeholder="10-digit" error={validateField("altNo", d.altNo)} {...visProps("alt_no")} />
              <TextField label="Work email" type="email" value={d.workEmail} onChange={(v) => set("workEmail", v)} error={validateField("workEmail", d.workEmail)} {...visProps("work_email")} />
              <TextField label="Personal email" type="email" value={d.personalEmail} onChange={(v) => set("personalEmail", v)} error={validateField("personalEmail", d.personalEmail)} {...visProps("personal_email")} />
            </div>
          </Section>

          <Section title="Work address" note="Shown or hidden as one block.">
            <AddressBlock
              value={d.workAddress}
              onChange={(k, v) => setAddr("workAddress", k, v)}
              visOn={isFieldVisible(vis, "work_address")}
              onToggleVis={() => toggleVis("work_address")}
            />
          </Section>

          <Section title="Home address" note="Optional. Shown or hidden as one block.">
            <AddressBlock
              value={d.homeAddress}
              onChange={(k, v) => setAddr("homeAddress", k, v)}
              visOn={isFieldVisible(vis, "home_address")}
              onToggleVis={() => toggleVis("home_address")}
            />
          </Section>

          <Section title="Factory address" note="Optional. Shown or hidden as one block.">
            <AddressBlock
              value={d.factoryAddress}
              onChange={(k, v) => setAddr("factoryAddress", k, v)}
              visOn={isFieldVisible(vis, "factory_address")}
              onToggleVis={() => toggleVis("factory_address")}
            />
          </Section>

          <Section title="Headline">
            <AreaField label="Positioning — what you do now" value={d.positioning} onChange={(v) => set("positioning", v)} />
            <AreaField label="Known for — the one memorable thing" value={d.knownFor} onChange={(v) => set("knownFor", v)} />
            <AreaField label="About" value={d.about} onChange={(v) => set("about", v)} />
          </Section>

          <Section title="Business">
            <TextField label="Company name" value={d.businessName} onChange={(v) => set("businessName", v)} />
            <AreaField label="What it does" value={d.businessDescription} onChange={(v) => set("businessDescription", v)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Founded (year)" value={d.foundedYear} onChange={(v) => set("foundedYear", v.replace(/[^0-9]/g, ""))} placeholder="2018" error={validateField("foundedYear", d.foundedYear)} />
              <TextField label="Team size" value={d.teamSize} onChange={(v) => set("teamSize", v)} placeholder="40 people" />
            </div>
            <TextField label="Company website" value={d.companyWebsite} onChange={(v) => set("companyWebsite", v)} placeholder="www.example.com" error={validateField("companyWebsite", d.companyWebsite)} />
            <AreaField label="Nature of business" value={d.natureOfBusiness} onChange={(v) => set("natureOfBusiness", v)} />
            <AreaField label="Biggest USP" value={d.usp} onChange={(v) => set("usp", v)} />
          </Section>

          <Section
            title="Portfolio"
            note={`Brochures, videos, case studies — up to ${MAX_ATTACHMENTS}.`}
          >
            <div className="space-y-4">
              {d.attachments.map((a, i) => (
                <div key={i} className="rounded border border-hairline p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <select
                      className={fieldCls + " max-w-[160px]"}
                      value={a.kind}
                      onChange={(e) =>
                        updateAttachment(i, {
                          kind: e.target.value as AttachmentKind,
                          // switching between file/link kinds clears the stale field
                          url: "",
                          filePath: "",
                        })
                      }
                    >
                      {(Object.keys(ATTACHMENT_KIND_LABELS) as AttachmentKind[]).map((k) => (
                        <option key={k} value={k}>
                          {ATTACHMENT_KIND_LABELS[k]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="text-[13px] text-ink-muted transition-colors hover:text-red"
                    >
                      Remove
                    </button>
                  </div>
                  <TextField
                    label="Title"
                    value={a.title}
                    onChange={(v) => updateAttachment(i, { title: v })}
                    placeholder="Company brochure"
                  />
                  {isFileKind(a.kind) ? (
                    <div className="mt-3">
                      <span className={labelCls + " mb-1.5 block"}>File</span>
                      {configured ? (
                        <AttachmentFile
                          filePath={a.filePath}
                          onUpload={(f) => uploadAttachment(i, f)}
                          onClear={() => updateAttachment(i, { filePath: "" })}
                        />
                      ) : (
                        <input
                          className={fieldCls}
                          placeholder="Storage path or URL"
                          value={a.filePath}
                          onChange={(e) => updateAttachment(i, { filePath: e.target.value })}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="mt-3">
                      <TextField
                        label="Link"
                        value={a.url}
                        onChange={(v) => updateAttachment(i, { url: v })}
                        placeholder="https://…"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {d.attachments.length < MAX_ATTACHMENTS && (
              <button
                type="button"
                onClick={addAttachment}
                className="mt-1 rounded border border-dashed border-hairline px-4 py-2.5 text-[14px] text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
              >
                + Add attachment
              </button>
            )}
          </Section>

          <Section title="Expertise" note="Comma separated.">
            <input
              className={fieldCls}
              value={d.expertise.join(", ")}
              placeholder="Manufacturing, Exports, B2B Sales"
              onChange={(e) => set("expertise", e.target.value.split(",").map((s) => s.trimStart()))}
              onBlur={(e) => set("expertise", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </Section>

          <Section title="Presence & Social Channels" note="Choose how members find you — connect automatically or manually enter link URLs.">
            <div className="mb-4 flex rounded-xl border border-hairline bg-surface-sunk p-1 max-w-md">
              <button
                type="button"
                className="flex-1 rounded-lg py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all bg-red text-white shadow-sm"
              >
                Manual Link Input
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all text-ink-muted hover:text-ink"
              >
                Auto-Connect (OAuth)
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="LinkedIn URL / Handle" value={d.linkedin} onChange={(v) => set("linkedin", v)} placeholder="https://linkedin.com/in/username" {...visProps("linkedin")} />
              <TextField label="GitHub URL / Handle" value={d.github} onChange={(v) => set("github", v)} placeholder="https://github.com/username" />
              <TextField label="Business Instagram" value={d.businessInstagram} onChange={(v) => set("businessInstagram", v)} placeholder="https://instagram.com/brand" {...visProps("business_instagram")} />
              <TextField label="Personal Instagram" value={d.personalInstagram} onChange={(v) => set("personalInstagram", v)} placeholder="https://instagram.com/username" {...visProps("personal_instagram")} />
              <TextField label="YouTube Channel / Video" value={d.youtube} onChange={(v) => set("youtube", v)} placeholder="https://youtube.com/@channel" />
              <TextField label="Telegram handle / link" value={d.telegram} onChange={(v) => set("telegram", v)} placeholder="https://t.me/username" />
              <TextField label="WhatsApp number or link" value={d.whatsappLink} onChange={(v) => set("whatsappLink", v)} placeholder="+91 XXXXXXXXXX or https://wa.me/..." {...visProps("whatsapp")} />
              <TextField label="Portfolio / Website Link" value={d.customLink} onChange={(v) => set("customLink", v)} placeholder="https://yourportfolio.com" />
              <TextField label="Best time to connect" value={d.bestTime} onChange={(v) => set("bestTime", v)} placeholder="10am–7pm Mon–Fri" />
            </div>

            <div className="mt-4">
              <span className={labelCls + " mb-2 block"}>Best mode to connect</span>
              <div className="flex flex-wrap gap-2">
                {CONNECT_MODES.map((m) => {
                  const on = d.bestModes.includes(m.value);
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => toggleBestMode(m.value)}
                      aria-pressed={on}
                      className={`rounded-xl border px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                        on
                          ? "border-red bg-red/10 text-red shadow-sm"
                          : "border-hairline bg-surface/70 text-ink-muted hover:border-hairline-bright hover:text-ink"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mt-3 flex items-center justify-between rounded-xl border border-hairline/80 bg-surface/60 px-4 py-3">
              <span className="text-[14px] text-ink">Allow WhatsApp DM direct from the portal</span>
              <span className="flex items-center gap-3">
                <EyeToggle on={isFieldVisible(vis, "whatsapp")} onClick={visProps("whatsapp").onToggleVis} />
                <input type="checkbox" checked={d.whatsappDm} onChange={(e) => set("whatsappDm", e.target.checked)} className="h-4 w-4 accent-red rounded cursor-pointer" />
              </span>
            </label>
          </Section>

          <Section title="Personal" note="Sensitive fields carry a toggle.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Birth date" type="date" value={d.birthDate} onChange={(v) => set("birthDate", v)} {...visProps("birth_date")} />
              <TextField label="Anniversary" type="date" value={d.anniversary} onChange={(v) => set("anniversary", v)} {...visProps("anniversary")} />
              <TextField label="Marital status" value={d.maritalStatus} onChange={(v) => set("maritalStatus", v)} {...visProps("marital_status")} />
              <TextField label="Blood group" value={d.bloodGroup} onChange={(v) => set("bloodGroup", v)} placeholder="O+" />
            </div>
            <AreaField label="Areas of interest" value={d.areasOfInterest} onChange={(v) => set("areasOfInterest", v)} {...visProps("areas_of_interest")} />
            <AreaField label="Associations affiliated with" value={d.networkGroups} onChange={(v) => set("networkGroups", v)} {...visProps("network_groups")} />
            <AreaField label="Companies you can connect others to" value={d.canConnect} onChange={(v) => set("canConnect", v)} {...visProps("can_connect")} />
            <AreaField label="Companies you want to connect with" value={d.wantConnect} onChange={(v) => set("wantConnect", v)} {...visProps("want_connect")} />
            <AreaField label="Your purpose / success mantra" value={d.purpose} onChange={(v) => set("purpose", v)} />
            <AreaField label="Favourite productivity tools" value={d.favouriteTools} onChange={(v) => set("favouriteTools", v)} />
            <AreaField label="How Manan's programs helped you at work" value={d.programBenefitWork} onChange={(v) => set("programBenefitWork", v)} />
            <AreaField label="How Manan's programs helped you personally" value={d.programBenefitPersonal} onChange={(v) => set("programBenefitPersonal", v)} />
            <AreaField label="How can you contribute to the Tribe" value={d.contribution} onChange={(v) => set("contribution", v)} {...visProps("contribution")} />
          </Section>
        </div>

        {/* Live preview */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <p className="kicker mb-3">Live preview</p>
            <div className="rounded border border-hairline bg-surface p-5">
              <p className="text-xl font-semibold text-ink">{fullName}</p>
              <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                {[d.roleTitle, d.industry, d.city].filter(Boolean).join("  /  ") ||
                  "role / industry / city"}
              </p>
              {d.positioning && (
                <p className="mt-4 text-[15px] leading-snug text-ink">{d.positioning}</p>
              )}
              {d.knownFor && (
                <p className="mt-4 border-t border-hairline pt-4 text-[15px] text-ink-secondary">
                  {d.knownFor}
                </p>
              )}
              {d.expertise.filter(Boolean).length > 0 && (
                <p className="mt-4 text-[13px] text-ink-muted">
                  {d.expertise.filter(Boolean).join("  /  ")}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 mt-10 flex items-center justify-between border-t border-hairline bg-paper/95 py-4 backdrop-blur">
        <span className="text-[14px] text-ink-muted">
          {status === "saved" && "✓ Saved"}
          {status === "error" && (
            <span className="text-red">Couldn&apos;t save: {errorMsg}</span>
          )}
        </span>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded bg-red px-7 py-3 text-[16px] font-medium text-paper transition-colors duration-150 hover:bg-red-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save feature"}
        </button>
      </div>
    </main>
  );
}
