import Link from "next/link";
import { getResources, type Resource } from "@/lib/community";

export const metadata = { title: "Campus — Altus Tribe" };

const SOCIALS: { label: string; url: string }[] = [
  { label: "YouTube", url: "#" },
  { label: "Facebook", url: "#" },
  { label: "Instagram", url: "#" },
  { label: "LinkedIn", url: "#" },
  { label: "X", url: "#" },
];

/* One numbered Swiss section (label column + content column). */
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
    <section className="border-t border-hairline py-12">
      <div className="md:grid md:grid-cols-[112px_minmax(0,1fr)] md:gap-10">
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

function ResourceList({ items }: { items: Resource[] }) {
  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <li key={r.id}>
          <a
            href={r.url ?? "#"}
            className="group block rounded border border-hairline bg-surface p-4 transition-all duration-150 ease-[var(--ease-altus)] hover:-translate-y-0.5 hover:border-ink-muted"
          >
            <p className="text-lg text-ink">
              {r.kind === "video" ? "▸ " : ""}
              {r.title}
            </p>
            {r.description && (
              <p className="mt-1 text-[15px] leading-relaxed text-ink-secondary">
                {r.description}
              </p>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function CampusPage() {
  const [videos, inspiration, productivity] = await Promise.all([
    getResources("video"),
    getResources("inspiration"),
    getResources("brochure"),
  ]);

  return (
    <main className="mx-auto w-full max-w-[900px] px-6 pt-8 sm:px-10">
      <header className="pb-6">
        <p className="kicker mb-4">Campus</p>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
          Keep sharpening.
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg leading-snug text-ink-secondary">
          The learning world — Manan&apos;s library, member wins, and the tools
          that keep the Tribe productive.
        </p>
      </header>

      <Section index={1} label="Manan Vasa Video Library">
        <ResourceList items={videos} />
      </Section>

      <Section index={2} label="Inspiration">
        <ResourceList items={inspiration} />
      </Section>

      <Section index={3} label="Productivity Resources">
        <ResourceList items={productivity} />
      </Section>

      <Section index={4} label="Invite to PS Orientation">
        <div className="rounded border border-hairline bg-surface p-6">
          <p className="text-[17px] leading-relaxed text-ink">
            Know someone who belongs in the Productivity School? Invite them to the
            next orientation.
          </p>
          <a
            href="#"
            className="mt-4 inline-block rounded bg-red px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover"
          >
            Send an invite →
          </a>
        </div>
      </Section>

      <Section index={5} label="Community Channels">
        <div className="flex flex-wrap gap-3">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.url}
              className="rounded border border-hairline px-5 py-2.5 text-[15px] text-ink transition-colors hover:border-ink-muted"
            >
              {s.label}
            </a>
          ))}
        </div>
      </Section>

      <div className="border-t border-hairline py-10">
        <Link
          href="/home"
          className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
        >
          ← Back to Tribe
        </Link>
      </div>
    </main>
  );
}
