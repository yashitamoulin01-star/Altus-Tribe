import Link from "next/link";
import { getMyProfileSummary } from "@/lib/dashboard";
import { Card, initials } from "./_shared";

// The member's identity at a glance + completion nudge + entry to view/edit.
export default async function ProfileSummaryCard() {
  const me = await getMyProfileSummary();

  if (!me.hasIdentity) {
    return (
      <Card>
        <p className="text-[17px] font-semibold text-ink">Build your feature</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">
          Complete your profile so the Tribe knows who you are.
        </p>
        <Link
          href="/onboarding"
          className="mt-4 inline-block rounded-lg bg-red px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover"
        >
          Start onboarding →
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-lg bg-surface-sunk">
          {me.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.photoUrl} alt={me.fullName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-xl text-ink-muted">
              {initials(me.fullName)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-semibold text-ink">{me.fullName}</p>
          <p className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            {[me.businessName, me.category].filter(Boolean).join("  ·  ") || "—"}
          </p>
          {(me.usp || me.natureOfBusiness) && (
            <p className="mt-2 line-clamp-2 text-[14px] leading-snug text-ink-secondary">
              {me.usp || me.natureOfBusiness}
            </p>
          )}
        </div>
      </div>

      {/* Completion */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            Profile completeness
          </span>
          <span className="font-mono text-[11px] tabular-nums text-ink">{me.completion}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
          <div className="h-full rounded-full bg-red transition-[width] duration-300" style={{ width: `${me.completion}%` }} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {me.slug && (
          <Link href={`/m/${me.slug}`} className="rounded-lg bg-red px-4 py-2 text-[14px] font-medium text-paper transition-colors hover:bg-red-hover">
            View profile
          </Link>
        )}
        <Link href="/account/edit" className="rounded-lg border border-hairline px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted">
          Edit profile
        </Link>
      </div>
    </Card>
  );
}
