"use client";

import { useEffect } from "react";
import Link from "next/link";

// Route-segment error boundary. Catches render/server-action errors within the
// app shell and offers a recovery path without a full reload.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced to the browser console; server-side is captured by the platform.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-[640px] flex-col items-center justify-center px-6 text-center">
      <p className="kicker mb-4">Something broke</p>
      <h1 className="text-4xl font-semibold tracking-[-0.02em] text-ink md:text-5xl">
        That didn&apos;t go through.
      </h1>
      <p className="mt-5 max-w-[42ch] text-lg leading-snug text-ink-secondary">
        An unexpected error interrupted this page. You can try again — if it keeps
        happening, let us know.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-red px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-hairline px-6 py-3 text-[15px] text-ink transition-colors hover:border-ink-muted"
        >
          Go home
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-[11px] text-ink-muted">Ref: {error.digest}</p>
      )}
    </main>
  );
}
