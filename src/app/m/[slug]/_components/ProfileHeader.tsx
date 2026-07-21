import type { Member } from "@/lib/members";

function initialsOf(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
}

// The identity header: photo, company logo, name, business, category/industry,
// USP. The definitive top of a member's digital business identity.
export default function ProfileHeader({ member }: { member: Member }) {
  const meta = [member.category, member.industry, member.city].filter(Boolean).join("  ·  ");

  return (
    <header className="grid gap-6 md:grid-cols-[210px_1fr] md:gap-10">
      <div className="aspect-[4/5] w-40 overflow-hidden rounded-xl bg-surface-sunk md:w-full">
        {member.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.photoUrl} alt={member.fullName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-3xl text-ink-muted">{initialsOf(member.fullName)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-end">
        <div className="mb-3 flex items-center gap-3">
          {member.companyLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.companyLogoUrl} alt="" className="h-9 w-9 shrink-0 rounded-md object-contain" />
          )}
          {member.business?.name && (
            <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-muted">
              {member.business.name}
            </p>
          )}
        </div>

        <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-[46px]">
          {member.fullName}
        </h1>
        {meta && (
          <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-muted">
            {meta}
          </p>
        )}
        <p className="mt-5 max-w-[42ch] text-xl leading-snug text-ink md:text-2xl">
          {member.usp || member.positioning}
        </p>
      </div>
    </header>
  );
}
