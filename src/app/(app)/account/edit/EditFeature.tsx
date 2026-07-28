"use client";

// ═══════════════════════════════════════════════════════════════════════════
// Profile completion / edit — thin wrapper around the SHARED ProfileForm (the
// exact same form used in onboarding). Single source of truth, so the two can
// never drift. Adds: header, admin-edit banner, profile-level visibility, and
// the sticky save bar. All 48 fields + their order live in ProfileForm.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { saveProfile } from "./actions";
import ProfileForm from "@/app/onboarding/ProfileForm";
import {
  composeFullName,
  isFieldVisible,
  type EditableAddress,
  type EditableProfile,
  type FieldVisibility,
} from "@/lib/profile-fields";

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
  adminTargetId?: string | null;
  backHref?: string;
  backLabel?: string;
  editingName?: string;
}) {
  const [d, setD] = useState<EditableProfile>(initial);
  const [vis, setVis] = useState<FieldVisibility>(initialVisibility);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pending, start] = useTransition();

  // Debounced autosave — mirrors onboarding.
  const firstRender = useRef(true);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!configured) return;
    if (firstRender.current) { firstRender.current = false; return; }
    setStatus("saving");
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveProfile(d, vis, adminTargetId ?? undefined)
        .then((r) => { if (r.ok) setStatus("saved"); else { setStatus("error"); setErrorMsg(r.error); } })
        .catch(() => setStatus("error"));
    }, 900);
    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, vis]);

  const set = <K extends keyof EditableProfile>(k: K, v: EditableProfile[K]) => { setD((p) => ({ ...p, [k]: v })); setStatus("idle"); };
  const setAddr = (which: "workAddress" | "homeAddress" | "factoryAddress", k: keyof EditableAddress, v: string) => { setD((p) => ({ ...p, [which]: { ...p[which], [k]: v } })); setStatus("idle"); };
  const copyFromWork = (which: "homeAddress" | "factoryAddress") => setD((p) => ({ ...p, [which]: { ...p.workAddress } }));
  const toggleVis = (key: string) => setVis((v) => ({ ...v, [key]: !isFieldVisible(v, key) }));

  const save = () =>
    start(async () => {
      const r = await saveProfile(d, vis, adminTargetId ?? undefined);
      if (r.ok) setStatus("saved"); else { setStatus("error"); setErrorMsg(r.error); }
    });

  const fullName = composeFullName(d) || "Your profile";

  return (
    <main className="mx-auto w-full max-w-[720px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
      <nav className="mb-6 flex items-center justify-between">
        <Link href={backHref} className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink">← {backLabel}</Link>
        {slug && configured && <Link href={`/m/${slug}`} className="text-[14px] text-red transition-colors hover:text-red-hover">View my feature →</Link>}
      </nav>

      <header className="mb-6">
        {adminTargetId && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red/30 bg-red/5 px-4 py-2.5">
            <span className="rounded bg-red/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-red">Admin edit</span>
            <p className="text-[14px] text-ink">You are editing{editingName ? ` ${editingName}` : " this member"}&apos;s profile on their behalf.</p>
          </div>
        )}
        <p className="kicker mb-2">Profile</p>
        <h1 className="text-[24px] font-bold tracking-[-0.015em] text-ink sm:text-[28px]">{adminTargetId ? "Edit this member's profile" : `Complete your profile — ${fullName}`}</h1>
        {!configured && <p className="mt-2 text-[14px] text-ink-muted">Preview mode — connect Supabase to save changes.</p>}
      </header>

      <ProfileForm
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
        canEditBatches={!!adminTargetId}
      />

      {/* Profile-level visibility */}
      <section className="mt-6 rounded-2xl border border-hairline bg-white p-5 shadow-sm">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Who can see your profile?</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([
            { v: "public", t: "Public", h: "Anyone with the link" },
            { v: "tribe", t: "Members only", h: "Signed-in Tribe members" },
            { v: "private", t: "Private", h: "Only you, admins & accepted connections" },
          ] as const).map((o) => {
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

      {/* Sticky save bar */}
      <div className="sticky bottom-0 mt-8 flex items-center justify-between border-t border-hairline bg-paper/95 py-4 backdrop-blur">
        <span className="text-[14px] text-ink-muted">
          {!configured ? "Preview mode — connect Supabase to save."
            : status === "saving" ? "Saving…"
            : status === "saved" ? "✓ All changes saved"
            : status === "error" ? <span className="text-red">Couldn&apos;t save: {errorMsg}</span>
            : "Changes save automatically"}
        </span>
        <button type="button" onClick={save} disabled={pending || status === "saving"} className="rounded-xl bg-red px-7 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-red-hover disabled:opacity-60">
          {pending || status === "saving" ? "Saving…" : "Save now"}
        </button>
      </div>
    </main>
  );
}
