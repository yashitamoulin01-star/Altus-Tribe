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
      className={`rounded-xl border border-hairline bg-surface p-5 ${className}`}
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
      <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-[13px] text-red transition-colors hover:text-red-hover"
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
      className="shrink-0 overflow-hidden rounded-full bg-surface-sunk"
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-mono text-[12px] text-ink-muted">
          {initials(name) || "·"}
        </div>
      )}
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-[14px] text-ink-muted">{children}</p>;
}

// Suspense fallback — a card with pulsing lines matching a widget's rough shape.
export function WidgetSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <div className="mb-4 h-3 w-24 animate-pulse rounded bg-surface-sunk" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-surface-sunk" />
        ))}
      </div>
    </Card>
  );
}
