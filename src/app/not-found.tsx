import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-[640px] flex-col items-center justify-center px-6 text-center">
      <p className="kicker mb-4">404</p>
      <h1 className="text-4xl font-semibold tracking-[-0.02em] text-ink md:text-5xl">
        This page isn&apos;t in the room.
      </h1>
      <p className="mt-5 max-w-[42ch] text-lg leading-snug text-ink-secondary">
        The page you&apos;re looking for was moved, or never existed.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-red px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover"
      >
        Back to Altus Tribe
      </Link>
    </main>
  );
}
