import Link from "next/link";
import { notFound } from "next/navigation";
import { getMember, getAllMemberSlugs } from "@/lib/members-data";
import { type Member, type MemberAddress } from "@/lib/members";

export async function generateStaticParams() {
  return (await getAllMemberSlugs()).map((slug) => ({ slug }));
}

const OPEN_TO_LABELS: Record<string, string> = {
  mentoring: "Mentoring",
  partnerships: "Partnerships",
  referrals: "Referrals",
  speaking: "Speaking",
  hiring: "Hiring",
};

/* One numbered Swiss section: label column + content column. */
function Section({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-hairline py-12 md:py-16">
      <div className="md:grid md:grid-cols-[112px_minmax(0,640px)] md:gap-10">
        <div className="mb-4 flex items-baseline gap-3 md:mb-0">
          <span className="font-mono text-xs tabular-nums text-red">
            {String(index).padStart(2, "0")}
          </span>
          <span className="kicker md:hidden">{label}</span>
        </div>
        <div>
          <p className="kicker mb-5 hidden md:block">{label}</p>
          {children}
        </div>
      </div>
    </section>
  );
}

/* One postal address rendered as stacked lines + a maps link. */
function AddressCard({ address }: { address: MemberAddress }) {
  const cityLine = [address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
  return (
    <div className="text-[16px] leading-relaxed text-ink-secondary">
      {address.lines.map((l, i) => (
        <p key={i}>{l}</p>
      ))}
      {cityLine && <p>{cityLine}</p>}
      {address.country && <p>{address.country}</p>}
      {address.mapLink && (
        <a
          href={address.mapLink}
          className="mt-2 inline-block text-[14px] text-red transition-colors hover:text-red-hover"
        >
          View on map →
        </a>
      )}
    </div>
  );
}

function MemberFeature({ member }: { member: Member }) {
  // Build the list of sections that actually have content, then number them.
  const sections: { label: string; node: React.ReactNode }[] = [];

  if (member.knownFor) {
    sections.push({
      label: "Known For",
      node: (
        <p className="text-2xl md:text-3xl leading-tight tracking-tight text-ink">
          {member.knownFor}
        </p>
      ),
    });
  }

  if (member.about) {
    sections.push({
      label: "About",
      node: (
        <p className="text-[17px] leading-[1.7] text-ink-secondary">
          {member.about}
        </p>
      ),
    });
  }

  if (member.expertise.length) {
    sections.push({
      label: "Expertise",
      node: (
        <p className="text-lg leading-relaxed text-ink-secondary">
          {member.expertise.join("  /  ")}
        </p>
      ),
    });
  }

  if (member.business) {
    const b = member.business;
    sections.push({
      label: "Business",
      node: (
        <div>
          <div className="flex items-center gap-3">
            {member.companyLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.companyLogoUrl}
                alt={`${b.name} logo`}
                className="h-10 w-10 shrink-0 rounded object-contain"
              />
            )}
            <p className="text-xl text-ink">{b.name}</p>
          </div>
          <p className="mt-1 text-[15px] text-ink-muted">
            {[b.foundedYear && `Founded ${b.foundedYear}`, b.teamSize]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {b.description && (
            <p className="mt-3 text-[17px] leading-[1.7] text-ink-secondary">
              {b.description}
            </p>
          )}
          {b.website && (
            <a
              href={`https://${b.website}`}
              className="mt-3 inline-block text-[15px] text-red transition-colors hover:text-red-hover"
            >
              {b.website} →
            </a>
          )}
        </div>
      ),
    });
  }

  if (member.offerings.length) {
    sections.push({
      label: "What I Do",
      node: (
        <ul className="space-y-5">
          {member.offerings.map((o) => (
            <li key={o.title}>
              <p className="text-lg text-ink">{o.title}</p>
              {o.description && (
                <p className="mt-1 text-[16px] leading-relaxed text-ink-secondary">
                  {o.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (member.work.length) {
    sections.push({
      label: "Work",
      node: (
        <div className="flex flex-wrap gap-3">
          {member.work.map((w) => (
            <a
              key={w.title}
              href={w.href}
              className="rounded border border-hairline bg-surface px-4 py-3 text-[15px] text-ink transition-all duration-150 ease-[var(--ease-altus)] hover:-translate-y-0.5 hover:border-ink-muted"
            >
              {w.kind === "video" ? "▸ " : ""}
              {w.title}
            </a>
          ))}
        </div>
      ),
    });
  }

  if (member.openTo.length) {
    sections.push({
      label: "Open to",
      node: (
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {member.openTo.map((o) => (
            <span key={o} className="text-[17px] text-ink">
              <span className="text-positive">✔</span>{" "}
              {OPEN_TO_LABELS[o] ?? o}
            </span>
          ))}
        </div>
      ),
    });
  }

  // Contact — only the fields that survived visibility stripping.
  const contact = member.contact;
  const contactRows = contact
    ? ([
        ["Cell", contact.cellNo, (v: string) => `tel:${v}`],
        ["Alt", contact.altNo, (v: string) => `tel:${v}`],
        ["Work email", contact.workEmail, (v: string) => `mailto:${v}`],
        ["Personal email", contact.personalEmail, (v: string) => `mailto:${v}`],
      ] as const).filter(([, v]) => Boolean(v))
    : [];
  if (contactRows.length) {
    sections.push({
      label: "Contact",
      node: (
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {contactRows.map(([label, value, href]) => (
            <div key={label}>
              <dt className="kicker mb-1">{label}</dt>
              <dd>
                <a
                  href={href(value as string)}
                  className="text-[17px] text-ink transition-colors hover:text-red"
                >
                  {value}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      ),
    });
  }

  // Locations — work / home / factory, each already gated in the data layer.
  const addressBlocks = (
    [
      ["Work", member.addresses?.work],
      ["Home", member.addresses?.home],
      ["Factory", member.addresses?.factory],
    ] as const
  ).filter(([, a]) => Boolean(a));
  if (addressBlocks.length) {
    sections.push({
      label: "Locations",
      node: (
        <div className="grid gap-8 sm:grid-cols-2">
          {addressBlocks.map(([label, a]) => (
            <div key={label}>
              <p className="kicker mb-2">{label}</p>
              <AddressCard address={a as MemberAddress} />
            </div>
          ))}
        </div>
      ),
    });
  }

  const initials = member.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <main className="mx-auto w-full max-w-[900px] px-6 sm:px-10">
      {/* Minimal top bar — one red affordance */}
      <nav className="flex items-center justify-between py-6">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
        >
          ← The Tribe
        </Link>
      </nav>

      {/* Hero */}
      <header className="grid gap-8 pb-12 pt-4 md:grid-cols-[200px_1fr] md:gap-12">
        <div className="aspect-[4/5] w-40 overflow-hidden rounded bg-surface-sunk md:w-full">
          {member.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photoUrl}
              alt={member.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-mono text-3xl text-ink-muted">
                {initials}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-end">
          <h1 className="text-4xl md:text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink">
            {member.fullName}
          </h1>
          <p className="mt-3 font-mono text-[13px] uppercase tracking-[0.12em] text-ink-muted">
            {[member.roleTitle, member.industry, member.city]
              .filter(Boolean)
              .join("  /  ")}
          </p>
          <p className="mt-6 max-w-[36ch] text-xl leading-snug text-ink md:text-2xl">
            {member.positioning}
          </p>
        </div>
      </header>

      {/* Numbered sections */}
      {sections.map((s, i) => (
        <Section key={s.label} index={i + 1} label={s.label}>
          {s.node}
        </Section>
      ))}

      {/* Connect — the one red CTA */}
      <div className="border-t border-hairline py-14">
        <a
          href={member.presence.find((p) => p.platform === "Email")?.url ?? "#"}
          className="inline-block rounded bg-red px-7 py-3.5 text-[16px] font-medium text-paper transition-colors duration-150 hover:bg-red-hover"
        >
          Connect →
        </a>
        <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-ink-muted">
          {member.presence.map((p) => (
            <a
              key={p.platform}
              href={p.url}
              className="transition-colors hover:text-ink"
            >
              {p.platform}
            </a>
          ))}
        </p>
      </div>
    </main>
  );
}

export default async function Page({ params }: PageProps<"/m/[slug]">) {
  const { slug } = await params;
  const member = await getMember(slug);
  if (!member) notFound();
  return <MemberFeature member={member} />;
}
