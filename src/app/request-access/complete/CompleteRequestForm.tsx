"use client";

import { useState, useTransition } from "react";
import ComboInput from "@/components/ComboInput";
import { COUNTRIES, INDIA_CITIES, INDIA_STATES } from "@/lib/geo";
import { validateResume } from "@/lib/access/logic";
import type { RequestPayload } from "@/lib/access/types";
import { submitAccessProfile } from "../actions";

const input =
  "w-full rounded-xl border border-hairline bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink-muted transition-colors focus:border-red/40 focus:outline-none focus:ring-4 focus:ring-red/8";
const area = input + " min-h-[92px] resize-y leading-relaxed";
const label = "block text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted mb-1.5";

function Field({ text, required, children }: { text: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={label}>{text}{required && <span className="ml-1 text-red">*</span>}</span>
      {children}
    </label>
  );
}

const empty: RequestPayload = {
  fullName: "", phoneE164: "", whatsappSameAsPhone: true, whatsappE164: "",
  company: "", designation: "", industry: "", city: "", state: "", country: "India",
  linkedinUrl: "", bio: "", areasOfInterest: "", connectedToAltus: "", resumeFileName: "",
};

export default function CompleteRequestForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [p, setP] = useState<RequestPayload>(empty);
  const [resumeErr, setResumeErr] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const set = <K extends keyof RequestPayload>(k: K, v: RequestPayload[K]) => setP((s) => ({ ...s, [k]: v }));

  const onResume = (f: File | undefined) => {
    setResumeErr(null);
    if (!f) return;
    const err = validateResume(f.name, f.size);
    if (err) { setResumeErr(err); return; }
    set("resumeFileName", f.name);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      // Resume bytes → private storage is deferred (checklist §C); we send the
      // file name only, and the service records a placeholder path.
      const r = await submitAccessProfile({ email, payload: p, resumePath: p.resumeFileName ? `pending/${p.resumeFileName}` : null });
      if (r.ok) { setDone(true); setMissing([]); }
      else setMissing(r.missing ?? []);
    });
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
        <p className="text-[16px] font-semibold text-ink">Request submitted</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-secondary">
          Thanks — our team will review your request and email you when a decision is made.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field text="Email" required>
        <input type="email" required className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field text="Full name" required>
          <input className={input} value={p.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </Field>
        <Field text="Designation">
          <input className={input} value={p.designation} onChange={(e) => set("designation", e.target.value)} placeholder="Founder, Director…" />
        </Field>
        <Field text="Phone number" required>
          <input className={input} inputMode="tel" value={p.phoneE164} onChange={(e) => set("phoneE164", e.target.value)} placeholder="10-digit mobile" />
        </Field>
        <Field text="WhatsApp number" required>
          <input className={input} inputMode="tel" disabled={p.whatsappSameAsPhone} value={p.whatsappSameAsPhone ? p.phoneE164 : p.whatsappE164} onChange={(e) => set("whatsappE164", e.target.value)} placeholder="WhatsApp number" />
          <label className="mt-1.5 flex items-center gap-2 text-[13px] text-ink-secondary">
            <input type="checkbox" checked={p.whatsappSameAsPhone} onChange={(e) => set("whatsappSameAsPhone", e.target.checked)} className="h-4 w-4 rounded border-hairline accent-red" />
            Same as phone number
          </label>
        </Field>
        <Field text="Company" required>
          <input className={input} value={p.company} onChange={(e) => set("company", e.target.value)} />
        </Field>
        <Field text="Industry / sector">
          <input className={input} value={p.industry} onChange={(e) => set("industry", e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field text="City" required>
          <ComboInput className={input} options={INDIA_CITIES} value={p.city} onChange={(v) => set("city", v)} placeholder="Start typing…" />
        </Field>
        <Field text="State">
          <ComboInput className={input} options={INDIA_STATES} value={p.state} onChange={(v) => set("state", v)} placeholder="Select or type" />
        </Field>
        <Field text="Country">
          <ComboInput className={input} options={COUNTRIES} value={p.country} onChange={(v) => set("country", v)} placeholder="Select or type" />
        </Field>
      </div>

      <Field text="LinkedIn profile">
        <input className={input} value={p.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="linkedin.com/in/username" />
      </Field>
      <Field text="How are you connected to Altus?" required>
        <input className={input} value={p.connectedToAltus} onChange={(e) => set("connectedToAltus", e.target.value)} placeholder="e.g. Attended the April 2026 Conclave" />
      </Field>
      <Field text="Short bio">
        <textarea className={area} value={p.bio} onChange={(e) => set("bio", e.target.value)} placeholder="What you do, in a sentence or two." />
      </Field>
      <Field text="Areas of interest">
        <textarea className={area} value={p.areasOfInterest} onChange={(e) => set("areasOfInterest", e.target.value)} placeholder="Networking, partnerships, mentoring…" />
      </Field>

      <div>
        <span className={label}>Resume / CV</span>
        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => onResume(e.target.files?.[0])} className="block w-full text-[13px] text-ink-secondary file:mr-3 file:rounded-lg file:border file:border-hairline file:bg-white file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-ink hover:file:border-hairline-bright" />
        {p.resumeFileName && !resumeErr && <p className="mt-1.5 text-[12px] text-ink-muted">Selected: {p.resumeFileName}</p>}
        {resumeErr && <p className="mt-1.5 text-[12px] text-red">{resumeErr}</p>}
        <p className="mt-1 text-[12px] text-ink-muted">PDF, DOC or DOCX. Maximum 10 MB. Stored privately.</p>
      </div>

      {missing.length > 0 && (
        <div className="rounded-xl border border-red/20 bg-red/5 px-4 py-3">
          <p className="text-[13px] font-semibold text-ink">Please complete: {missing.join(", ")}.</p>
        </div>
      )}

      <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-red px-7 py-3 text-[15px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover active:scale-[0.99] disabled:opacity-60">
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
