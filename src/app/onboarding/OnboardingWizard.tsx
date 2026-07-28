"use client";

// ═══════════════════════════════════════════════════════════════════════════
// Onboarding (after Request Access) — thin wrapper around the SHARED ProfileForm.
// Same form the profile-completion / edit screen uses (single source of truth).
// Adds: welcome header, profile-level visibility, legal declarations, submit →
// finish. All 48 fields + their order live in ProfileForm.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useTransition } from "react";
import { saveProfile } from "@/app/(app)/account/edit/actions";
import { finishOnboarding } from "./actions";
import LegalModal, { type LegalDocType } from "@/components/LegalModal";
import ProfileForm, { type ProfileFormHandle } from "./ProfileForm";
import {
  composeFullName,
  computeProfileCompletion,
  isFieldVisible,
  requiredSetupMissing,
  type EditableAddress,
  type EditableProfile,
  type FieldVisibility,
} from "@/lib/profile-fields";

const Check = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const Arrow = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);

export default function OnboardingWizard({
  initial,
  initialVisibility,
  userId,
  industries,
  categories,
  configured,
}: {
  initial: EditableProfile;
  initialVisibility: FieldVisibility;
  initialStep?: number;
  slug: string | null;
  userId: string | null;
  industries: string[];
  categories: string[];
  configured: boolean;
}) {
  const [d, setD] = useState<EditableProfile>(initial);
  const [vis, setVis] = useState<FieldVisibility>(initialVisibility);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [finishing, startFinish] = useTransition();
  const [done, setDone] = useState(false);
  const [certifyAccurate, setCertifyAccurate] = useState(false);
  const [understandDisplay, setUnderstandDisplay] = useState(false);
  const [agreeDeclaration, setAgreeDeclaration] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);
  const [tried, setTried] = useState(false);

  const formRef = useRef<ProfileFormHandle>(null);
  const firstRender = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced autosave — every edit persists on its own after 900ms of quiet.
  useEffect(() => {
    if (!configured) return;
    if (firstRender.current) { firstRender.current = false; return; }
    setSaveState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveProfile(d, vis)
        .then((r) => setSaveState(r.ok ? "saved" : "error"))
        .catch(() => setSaveState("error"));
    }, 900);
    return () => clearTimeout(timer.current);
  }, [d, vis, configured]);

  const set = <K extends keyof EditableProfile>(k: K, v: EditableProfile[K]) => setD((p) => ({ ...p, [k]: v }));
  const setAddr = (which: "workAddress" | "homeAddress" | "factoryAddress", k: keyof EditableAddress, v: string) =>
    setD((p) => ({ ...p, [which]: { ...p[which], [k]: v } }));
  const copyFromWork = (which: "homeAddress" | "factoryAddress") => setD((p) => ({ ...p, [which]: { ...p.workAddress } }));
  const toggleVis = (key: string) => setVis((v) => ({ ...v, [key]: !isFieldVisible(v, key) }));

  const completion = computeProfileCompletion(d);
  const missing = requiredSetupMissing(d);
  const legalOk = certifyAccurate && understandDisplay && agreeDeclaration;

  const submit = () => {
    setTried(true);
    // Reveal the first missing required field (opens its section + scrolls).
    if (formRef.current?.revealFirstError()) return;
    if (!legalOk) return;
    startFinish(async () => {
      if (configured) await saveProfile(d, vis);
      await finishOnboarding();
      setDone(true);
    });
  };

  if (done) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="mx-auto flex max-w-[640px] flex-col items-center px-6 py-24 text-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-red/20 bg-red/10 text-red">{Check}</div>
          <h1 className="mt-8 text-[28px] font-bold tracking-tight text-ink">You&apos;re in, {composeFullName(d).split(" ")[0] || "welcome"}</h1>
          <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-ink-secondary">Your networking identity is live. Welcome to the Altus Tribe.</p>
          <a href="/home" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red px-8 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover active:scale-95">Go to dashboard <span aria-hidden>{Arrow}</span></a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto w-full max-w-[720px] px-5 py-8 sm:px-8 sm:py-12">
        <header className="mb-6">
          <p className="kicker mb-2">Welcome to Altus Tribe</p>
          <h1 className="text-[24px] font-bold leading-tight tracking-[-0.015em] text-ink sm:text-[28px]">Build your networking identity</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">
            Fill in each section below — expand any card to edit it. Everything saves automatically, so you can pause and resume anytime.
            {!configured && <span className="ml-1 text-ink-muted">(Preview mode — connect Supabase to save.)</span>}
          </p>
          {configured && (
            <p className="mt-1 text-[12px] text-ink-muted">
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ All changes saved" : saveState === "error" ? "Save failed — will retry" : ""}
            </p>
          )}
        </header>

        <ProfileForm
          ref={formRef}
          d={d}
          vis={vis}
          set={set}
          setAddr={setAddr}
          copyFromWork={copyFromWork}
          toggleVis={toggleVis}
          configured={configured}
          userId={userId}
          industries={industries}
          categories={categories}
        />

        {/* Profile-level visibility (who can see your whole profile) */}
        <section className="mt-6 rounded-2xl border border-hairline bg-white p-5 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Who can see your profile?</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { v: "public", t: "Public", h: "Anyone with the link" },
              { v: "tribe", t: "Members only", h: "Signed-in Tribe members" },
              { v: "private", t: "Private", h: "Only you & admins" },
            ].map((o) => {
              const on = d.visibility === o.v;
              return (
                <button key={o.v} type="button" onClick={() => set("visibility", o.v as EditableProfile["visibility"])} aria-pressed={on} className={`rounded-2xl border px-4 py-4 text-left transition-all ${on ? "border-red/40 bg-red/8 shadow-sm" : "border-hairline bg-white hover:border-hairline-bright"}`}>
                  <p className={`text-[15px] font-semibold ${on ? "text-red" : "text-ink"}`}>{o.t}</p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">{o.h}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Missing-required summary (only after a submit attempt) */}
        {tried && missing.length > 0 && (
          <div className="mt-6 rounded-2xl border border-red/20 bg-red/5 px-5 py-4">
            <p className="mb-2 text-[14px] font-semibold text-ink">A few required details are still needed:</p>
            <ul className="space-y-1">
              {missing.map((m) => (
                <li key={m} className="flex items-center gap-2 text-[13px] text-red"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red" aria-hidden />{m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Legal declarations */}
        <div className="mt-6 space-y-4 rounded-2xl border border-hairline bg-white p-5 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Before you submit</p>
          {[
            { state: certifyAccurate, setState: setCertifyAccurate, text: "I certify that the information I've provided is accurate." },
            { state: understandDisplay, setState: setUnderstandDisplay, text: "I understand my profile will be displayed according to my selected privacy settings." },
            { state: agreeDeclaration, setState: setAgreeDeclaration, text: null },
          ].map((item, idx) => (
            <label key={idx} className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={item.state} onChange={(e) => item.setState(e.target.checked)} className="mt-0.5 h-4 w-4 cursor-pointer rounded border-hairline accent-red" />
              <span className="text-[14px] leading-relaxed text-ink-secondary">
                {idx === 2 ? (<>I agree to the <button type="button" onClick={() => setLegalDoc("declaration")} className="font-semibold text-ink underline transition-colors hover:text-red">Altus Tribe Profile Declaration</button>.</>) : item.text}
              </span>
            </label>
          ))}
          {tried && !legalOk && <p className="text-[12px] text-red">Please accept all three declarations to finish.</p>}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-hairline pt-6">
          <span className="text-[13px] text-ink-muted">Profile richness: <span className="font-semibold text-ink">{completion}%</span></span>
          <button type="button" onClick={submit} disabled={finishing} className="inline-flex items-center gap-2 rounded-xl bg-red px-7 py-3 text-[15px] font-semibold text-white shadow-sm shadow-red/20 transition-all hover:bg-red-hover active:scale-95 disabled:opacity-60">
            {finishing ? "Saving…" : "Submit & finish"} <span aria-hidden>{Arrow}</span>
          </button>
        </div>
      </main>

      <LegalModal type={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}
