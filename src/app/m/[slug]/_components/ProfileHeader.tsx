import type { Member } from "@/lib/members";

function initialsOf(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
}

export default function ProfileHeader({ member }: { member: Member }) {
  const meta = [member.category, member.industry, member.city].filter(Boolean).join("  ·  ");

  return (
    <header className="grid gap-6 md:grid-cols-[220px_1fr] md:gap-10 items-end rounded-2xl border border-hairline/80 bg-surface/80 p-6 backdrop-blur-md shadow-2xl">
      <div className="relative aspect-[4/5] w-44 overflow-hidden rounded-xl border border-hairline bg-surface-sunk shadow-md md:w-full group">
        {member.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.photoUrl} alt={member.fullName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-3xl font-bold text-ink-muted">{initialsOf(member.fullName)}</span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1">
          <span className="h-2 w-2 rounded-full bg-red red-dot-pulse" />
          <span className="font-mono text-[9px] text-white uppercase tracking-wider font-medium">Tribe Participant</span>
        </div>
      </div>

      <div className="flex flex-col justify-end">
        <div className="mb-3 flex items-center gap-3">
          {member.companyLogoUrl && (
            <div className="p-1 rounded-lg border border-hairline bg-surface-sunk">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={member.companyLogoUrl} alt="" className="h-8 w-8 shrink-0 object-contain" />
            </div>
          )}
          {member.business?.name && (
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-red font-semibold">
              {member.business.name}
            </p>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-5xl">
          {member.fullName}
        </h1>
        {meta && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            {meta}
          </p>
        )}
        {(member.usp || member.positioning) && (
          <p className="mt-4 max-w-[48ch] text-lg leading-relaxed text-ink-secondary md:text-xl font-normal">
            {member.usp || member.positioning}
          </p>
        )}
      </div>
    </header>
  );
}

