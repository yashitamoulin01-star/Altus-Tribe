import ImportStepper from "./ImportStepper";

export default function AdminImportPage() {
  return (
    <main className="mx-auto w-full max-w-[760px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Import</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Bring the cohort in.
      </h1>
      <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink-secondary">
        Upload a CSV (export Excel as CSV), map the columns, and confirm. New
        members land in the roster; you can flesh out each feature afterwards.
      </p>

      <div className="mt-8">
        <ImportStepper />
      </div>
    </main>
  );
}
