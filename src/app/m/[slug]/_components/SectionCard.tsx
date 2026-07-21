// Profile section primitives (Phase 4). `Detail`/`Prose` are the "PrivacyField":
// they render nothing when the value is empty or null — and the data layer sets
// hidden fields to null — so privacy is respected with no per-component handling.

export default function SectionCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-hairline bg-surface p-6 md:p-8">
      <h2 className="mb-5 font-mono text-[11px] uppercase tracking-[0.14em] text-red">
        {label}
      </h2>
      {children}
    </section>
  );
}

export function DetailGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">{children}</dl>;
}

// A short labelled value. Hidden entirely when empty/null.
export function Detail({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href?: string;
}) {
  const v = (value ?? "").toString().trim();
  if (!v) return null;
  return (
    <div>
      <dt className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </dt>
      <dd className="text-[16px] leading-relaxed text-ink">
        {href ? (
          <a href={href} className="transition-colors hover:text-red">
            {v}
          </a>
        ) : (
          v
        )}
      </dd>
    </div>
  );
}

// A labelled long-form paragraph. Hidden entirely when empty/null.
export function Prose({
  label,
  value,
}: {
  label?: string;
  value?: string | null;
}) {
  const v = (value ?? "").toString().trim();
  if (!v) return null;
  return (
    <div>
      {label && (
        <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
          {label}
        </p>
      )}
      <p className="whitespace-pre-line text-[16px] leading-[1.7] text-ink-secondary">
        {v}
      </p>
    </div>
  );
}
