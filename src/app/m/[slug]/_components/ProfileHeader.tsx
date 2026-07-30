import type { Member } from "@/lib/members";

function initialsOf(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
}

// LinkedIn-style hero: a branded gradient cover banner with the participant's
// name as a light watermark, an overlapping circular avatar, then identity +
// headline below. Strictly brand palette (red / black / white / grey).
export default function ProfileHeader({ member }: { member: Member }) {
  const meta = [member.category, member.industry, member.city].filter(Boolean).join("  ·  ");
  const headline = member.usp || member.positioning;

  return (
    <header className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-md">
      {/* Cover banner — brand gradient + subtle dot pattern + name watermark */}
      <div className="relative h-32 w-full bg-gradient-to-br from-red via-red-hover to-[#1a0608] sm:h-40">
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "22px 22px" }}
        />
        <p className="pointer-events-none absolute bottom-3 right-5 max-w-[60%] truncate text-right text-2xl font-semibold tracking-tight text-white/20 sm:text-3xl">
          {member.fullName}
        </p>
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white">Tribe Participant</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-6 sm:px-8">
        <div className="-mt-12 flex items-end justify-between gap-4 sm:-mt-14">
          {/* Overlapping avatar */}
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-surface bg-surface-sunk shadow-lg sm:h-28 sm:w-28">
            {member.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.photoUrl} alt={member.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red to-red-hover">
                <span className="text-2xl font-bold text-white">{initialsOf(member.fullName)}</span>
              </div>
            )}
          </div>

          {/* Company logo chip (bottom-aligned, like a page badge) */}
          {member.companyLogoUrl && (
            <div className="mb-1 rounded-lg border border-hairline bg-surface p-1.5 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={member.companyLogoUrl} alt="" className="h-9 w-9 shrink-0 object-contain" />
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{member.fullName}</h1>
            {/* Verified-style brand check */}
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red text-white" title="Verified Tribe participant">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
          </div>

          {member.business?.name && (
            <p className="mt-1 text-[15px] font-semibold text-red">{member.business.name}</p>
          )}

          {headline && (
            <p className="mt-2 max-w-[60ch] text-[16px] leading-relaxed text-ink-secondary">{headline}</p>
          )}

          {meta && (
            <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">{meta}</p>
          )}
        </div>
      </div>
    </header>
  );
}
