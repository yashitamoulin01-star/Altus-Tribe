import CompleteRequestForm from "./CompleteRequestForm";

export const metadata = { title: "Complete your request — Altus Tribe" };

// Step 4/5. In production this is reached via the single-use magic link (token
// validation deferred — checklist §D). In mock mode it's directly accessible so
// the form and submission flow can be exercised end-to-end without live auth.
export default async function CompleteRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-[720px] px-5 py-10 sm:px-8">
        <div className="mb-6">
          <div className="mb-4 inline-flex items-center gap-2">
            <span className="text-[16px] font-bold tracking-[-0.02em] text-ink">ALTUS</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-red">Tribe</span>
          </div>
          <h1 className="text-[24px] font-bold tracking-[-0.015em] text-ink sm:text-[28px]">
            Complete your access request
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">
            Tell us a little about yourself. Our team reviews every request before granting access.
          </p>
        </div>
        <CompleteRequestForm initialEmail={email ?? ""} />
      </div>
    </main>
  );
}
