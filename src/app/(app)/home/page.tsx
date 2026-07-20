import Link from "next/link";
import { loadEditable } from "@/lib/profile-edit";
import { getAllMembers } from "@/lib/members-data";
import { composeFullName } from "@/lib/profile-fields";
import ShareButtons from "@/components/ShareButtons";

export const metadata = { title: "Tribe — Altus Tribe" };

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

export default async function HomePage() {
  const [state, members] = await Promise.all([loadEditable(), getAllMembers()]);
  const d = state?.data;
  const slug = state?.slug ?? null;
  const fullName = d ? composeFullName(d) : "";
  const hasIdentity = Boolean(fullName);

  // A small spotlight strip — other members to discover (exclude self).
  const spotlight = members.filter((m) => m.slug !== slug).slice(0, 3);

  const metaLine = d
    ? [d.businessName, d.category, d.city].filter(Boolean).join("  /  ")
    : "";

  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 pt-8 sm:px-10">
      {/* Top row: world label + notification bell */}
      <div className="flex items-center justify-between">
        <p className="kicker">Tribe</p>
        <Link
          href="/sacred-space"
          aria-label="Announcements"
          className="rounded-full p-2 text-ink-muted transition-colors hover:text-ink"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </Link>
      </div>

      {/* Hero: the member's own cover */}
      {hasIdentity ? (
        <section className="mt-6 grid gap-8 border-b border-hairline pb-14 md:grid-cols-[220px_1fr] md:gap-12">
          <div className="aspect-[4/5] w-40 overflow-hidden rounded bg-surface-sunk md:w-full">
            {d?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.photoUrl} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-mono text-3xl text-ink-muted">{initialsOf(fullName)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-end">
            <p className="kicker mb-3">Your feature</p>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-[44px]">
              {fullName}
            </h1>
            {metaLine && (
              <p className="mt-3 font-mono text-[13px] uppercase tracking-[0.12em] text-ink-muted">
                {metaLine}
              </p>
            )}
            {d?.usp && (
              <p className="mt-5 max-w-[46ch] text-xl leading-snug text-ink md:text-2xl">
                {d.usp}
              </p>
            )}
            {!d?.usp && d?.positioning && (
              <p className="mt-5 max-w-[46ch] text-xl leading-snug text-ink md:text-2xl">
                {d.positioning}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {slug && (
                <Link
                  href={`/m/${slug}`}
                  className="rounded bg-red px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover"
                >
                  View my feature →
                </Link>
              )}
              <Link
                href="/account/edit"
                className="rounded border border-hairline px-5 py-3 text-[15px] text-ink transition-colors hover:border-ink-muted"
              >
                Edit
              </Link>
            </div>

            {slug && (
              <div className="mt-5">
                <p className="kicker mb-2">Share your feature</p>
                <ShareButtons slug={slug} name={fullName} />
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="mt-6 border-b border-hairline pb-14">
          <h1 className="mt-4 max-w-[18ch] text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
            Welcome to the Tribe.
          </h1>
          <p className="mt-5 max-w-[46ch] text-lg leading-snug text-ink-secondary">
            Build your feature so the room knows who you are.
          </p>
          <Link
            href="/onboarding"
            className="mt-7 inline-block rounded bg-red px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover"
          >
            Build my feature →
          </Link>
        </section>
      )}

      {/* Gateway: Explore the Tribe */}
      <section className="py-12">
        <div className="flex items-end justify-between">
          <div>
            <p className="kicker mb-2">Discover</p>
            <h2 className="text-2xl font-semibold tracking-[-0.015em] text-ink">
              People worth knowing.
            </h2>
          </div>
          <Link
            href="/explore"
            className="text-[14px] text-red transition-colors hover:text-red-hover"
          >
            Explore all →
          </Link>
        </div>

        {spotlight.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3">
            {spotlight.map((m) => (
              <Link
                key={m.slug}
                href={`/m/${m.slug}`}
                className="group flex flex-col overflow-hidden rounded border border-hairline bg-surface transition-all duration-150 ease-[var(--ease-altus)] hover:-translate-y-0.5 hover:border-ink-muted"
              >
                <div className="aspect-[4/5] w-full overflow-hidden bg-surface-sunk">
                  {m.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photoUrl} alt={m.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-mono text-2xl text-ink-muted">{initialsOf(m.fullName)}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-lg font-semibold leading-tight text-ink">{m.fullName}</p>
                  <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                    {[m.roleTitle, m.industry, m.city].filter(Boolean).join("  /  ")}
                  </p>
                  <p className="mt-3 line-clamp-2 text-[15px] leading-snug text-ink-secondary">
                    {m.positioning}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
