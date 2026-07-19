"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { saveOnboarding, finishOnboarding } from "./actions";
import { computeCompletion, type OnboardingData } from "@/lib/onboarding-shared";

const STEPS = ["Identity", "Headline", "Story", "Business", "Reveal"] as const;

const fieldCls =
  "w-full rounded border border-hairline bg-surface-sunk px-4 py-3 text-[16px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-red/40";
const labelCls =
  "mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted";
const areaCls = fieldCls + " min-h-[120px] leading-relaxed resize-y";

export default function OnboardingWizard({
  initial,
  initialStep,
  slug,
  configured,
}: {
  initial: OnboardingData;
  initialStep: number;
  slug: string | null;
  configured: boolean;
}) {
  const [data, setData] = useState<OnboardingData>(initial);
  const [step, setStep] = useState(Math.min(initialStep, STEPS.length - 1));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [isFinishing, startFinish] = useTransition();

  const firstRender = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced autosave whenever data or step changes (#13, #14).
  useEffect(() => {
    if (!configured) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveOnboarding(data, step).then((r) =>
        setSaveState(r.ok ? "saved" : "error"),
      );
    }, 800);
    return () => clearTimeout(timer.current);
  }, [data, step, configured]);

  const completion = computeCompletion(data);
  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData((d) => ({ ...d, [key]: value }));
  const setBiz = (key: keyof OnboardingData["business"], value: string) =>
    setData((d) => ({ ...d, business: { ...d.business, [key]: value } }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () =>
    startFinish(async () => {
      if (configured) await saveOnboarding(data, step);
      await finishOnboarding(slug ?? undefined);
    });

  return (
    <main className="mx-auto w-full max-w-[620px] flex-1 px-6 py-12 sm:px-10">
      {/* Progress header */}
      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="kicker">
            Step {step + 1} / {STEPS.length} · {STEPS[step]}
          </p>
          <span className="font-mono text-[11px] tabular-nums text-ink-muted">
            {completion}% complete
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-sunk">
          <div
            className="h-full rounded-full bg-red transition-[width] duration-300 ease-[var(--ease-altus)]"
            style={{ width: `${completion}%` }}
          />
        </div>
        {configured ? (
          <p className="mt-2 h-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "✓ Saved"
                : saveState === "error"
                  ? "Couldn't save — check your connection"
                  : ""}
          </p>
        ) : (
          <p className="mt-2 text-[13px] text-ink-muted">
            Preview mode — connect Supabase to save your progress.
          </p>
        )}
      </div>

      {/* Steps */}
      {step === 0 && (
        <Step title="Let's make your feature." hint="Start with the basics. This is a shoot, not a form.">
          <Field label="Full name">
            <input
              className={fieldCls}
              value={data.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Yashita Mouli"
            />
          </Field>
          <Field label="Role / title">
            <input
              className={fieldCls}
              value={data.roleTitle}
              onChange={(e) => set("roleTitle", e.target.value)}
              placeholder="Founder"
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Industry">
              <input
                className={fieldCls}
                value={data.industry}
                onChange={(e) => set("industry", e.target.value)}
                placeholder="Manufacturing"
              />
            </Field>
            <Field label="City">
              <input
                className={fieldCls}
                value={data.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Mumbai"
              />
            </Field>
          </div>
        </Step>
      )}

      {step === 1 && (
        <Step title="Your headline." hint="Two lines that make you unforgettable.">
          <Field label="Positioning — what you do now">
            <textarea
              className={areaCls}
              value={data.positioning}
              onChange={(e) => set("positioning", e.target.value)}
              placeholder="Helping Indian manufacturers build sustainable export businesses."
            />
          </Field>
          <Field label="Known for — the one memorable thing">
            <textarea
              className={areaCls}
              value={data.knownFor}
              onChange={(e) => set("knownFor", e.target.value)}
              placeholder="Built India's first fully compostable FMCG packaging line."
            />
          </Field>
        </Step>
      )}

      {step === 2 && (
        <Step title="Your story." hint="The narrative and the skills behind it.">
          <Field label="About">
            <textarea
              className={areaCls}
              value={data.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="What you left, what you're building, and why it matters."
            />
          </Field>
          <Field label="Expertise — comma separated">
            <input
              className={fieldCls}
              value={data.expertise.join(", ")}
              onChange={(e) =>
                set(
                  "expertise",
                  e.target.value.split(",").map((s) => s.trimStart()),
                )
              }
              onBlur={(e) =>
                set(
                  "expertise",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              placeholder="Manufacturing, Exports, B2B Sales, Sustainability"
            />
          </Field>
        </Step>
      )}

      {step === 3 && (
        <Step title="Your business." hint="Where people can find and work with you.">
          <Field label="Company name">
            <input
              className={fieldCls}
              value={data.business.name}
              onChange={(e) => setBiz("name", e.target.value)}
              placeholder="GreenWrap Industries"
            />
          </Field>
          <Field label="What it does">
            <textarea
              className={areaCls}
              value={data.business.description}
              onChange={(e) => setBiz("description", e.target.value)}
              placeholder="Compostable, export-grade packaging for FMCG brands."
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Founded (year)">
              <input
                className={fieldCls}
                inputMode="numeric"
                value={data.business.foundedYear}
                onChange={(e) =>
                  setBiz("foundedYear", e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="2018"
              />
            </Field>
            <Field label="Team size">
              <input
                className={fieldCls}
                value={data.business.teamSize}
                onChange={(e) => setBiz("teamSize", e.target.value)}
                placeholder="40 people"
              />
            </Field>
          </div>
          <Field label="Website">
            <input
              className={fieldCls}
              value={data.business.website}
              onChange={(e) => setBiz("website", e.target.value)}
              placeholder="greenwrap.in"
            />
          </Field>
        </Step>
      )}

      {step === 4 && (
        <Reveal data={data} slug={slug} configured={configured} />
      )}

      {/* Nav */}
      <div className="mt-12 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="text-[15px] text-ink-muted transition-colors hover:text-ink disabled:invisible"
        >
          ← Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="rounded bg-red px-7 py-3 text-[16px] font-medium text-paper transition-colors duration-150 hover:bg-red-hover"
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={isFinishing}
            className="rounded bg-red px-7 py-3 text-[16px] font-medium text-paper transition-colors duration-150 hover:bg-red-hover disabled:opacity-60"
          >
            {isFinishing ? "…" : "Enter the Tribe →"}
          </button>
        )}
      </div>
    </main>
  );
}

function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-[-0.015em] text-ink">
        {title}
      </h1>
      <p className="mt-2 text-[16px] text-ink-secondary">{hint}</p>
      <div className="mt-8 space-y-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function Reveal({
  data,
  slug,
  configured,
}: {
  data: OnboardingData;
  slug: string | null;
  configured: boolean;
}) {
  const link = slug ? `/m/${slug}` : "/account";
  return (
    <div>
      <p className="kicker mb-4">Here&apos;s your feature</p>
      <h1 className="text-3xl font-semibold tracking-[-0.015em] text-ink">
        {data.fullName || "Your name"}, you&apos;re ready.
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-ink-secondary">
        {data.positioning ||
          "Your positioning will headline your feature once you add it."}
      </p>

      <div className="mt-8 rounded border border-hairline bg-surface p-6">
        <p className="text-xl text-ink">{data.knownFor || "Your defining line."}</p>
        {data.expertise.filter(Boolean).length > 0 && (
          <p className="mt-4 text-[15px] text-ink-secondary">
            {data.expertise.filter(Boolean).join("  /  ")}
          </p>
        )}
      </div>

      {configured && slug && (
        <Link
          href={link}
          className="mt-6 inline-block text-[15px] text-red transition-colors hover:text-red-hover"
        >
          Preview your public feature →
        </Link>
      )}

      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
        Share your Altus link
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <ShareButton
          label="WhatsApp"
          href={`https://wa.me/?text=${encodeURIComponent(`My Altus Tribe feature: ${link}`)}`}
        />
        <ShareButton
          label="Email"
          href={`mailto:?subject=${encodeURIComponent("My Altus Tribe feature")}&body=${encodeURIComponent(link)}`}
        />
      </div>
    </div>
  );
}

function ShareButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded border border-hairline bg-surface px-4 py-2.5 text-[15px] text-ink transition-colors hover:border-ink-muted"
    >
      {label}
    </a>
  );
}
