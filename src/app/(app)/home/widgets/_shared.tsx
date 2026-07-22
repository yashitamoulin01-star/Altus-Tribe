import Link from "next/link";

// Shared dashboard-widget primitives. Function-first: a consistent card shell,
// header, avatar, and skeleton so widgets look uniform without per-widget polish.

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-hairline/80 bg-surface/90 p-5 backdrop-blur-md shadow-lg transition-all duration-200 hover:border-hairline-bright ${className}`}
    >
      {children}
    </section>
  );
}

export function WidgetHeader({
  title,
  href,
  cta = "See all",
}: {
  title: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-red" />
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-[12px] font-medium text-red transition-all duration-200 hover:text-red-hover hover:translate-x-0.5"
        >
          {cta} →
        </Link>
      )}
    </div>
  );
}

export function Avatar({
  url,
  name,
  size = 40,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full border border-hairline bg-surface-sunk shadow-inner"
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-mono text-[12px] font-semibold text-ink-muted">
          {initials(name) || "·"}
        </div>
      )}
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-hairline/70 p-4 text-center">
      <p className="text-[13px] text-ink-muted">{children}</p>
    </div>
  );
}

// Suspense fallback — a card with pulsing skeleton lines matching dark theme.
export function WidgetSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <div className="mb-4 h-3 w-28 animate-pulse rounded-md bg-surface-sunk" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded-md bg-surface-sunk" />
        ))}
      </div>
    </Card>
  );
}

