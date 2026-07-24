import Link from "next/link";
import type { ReactNode } from "react";

// Canonical Altus ecosystem card (Productivity Shastra visual grammar):
// red icon-tile → title → description → arrow, on a white surface with a thin
// border, subtle elevation and a calm hover. Foundation primitive (UI-1) —
// pages adopt it in later checkpoints. Renders as an internal or external link.
export function EcosystemCard({
  href,
  title,
  description,
  icon,
  external = false,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  external?: boolean;
}) {
  const inner = (
    <div className="eco-card group flex items-start gap-4 p-5">
      <span className="icon-tile shrink-0" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="t-card-title text-ink">{title}</h3>
        <p className="t-body-sm mt-1">{description}</p>
      </div>
      <span
        className="mt-0.5 shrink-0 text-ink-muted transition-colors group-hover:text-red"
        aria-hidden
      >
        →
      </span>
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block no-underline">
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className="block no-underline">
      {inner}
    </Link>
  );
}
