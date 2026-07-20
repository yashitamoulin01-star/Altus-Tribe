import Link from "next/link";
import { getAnnouncements } from "@/lib/community";

export const metadata = { title: "Sacred Space — Altus Tribe" };

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default async function SacredSpacePage() {
  const announcements = await getAnnouncements();

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 pt-8 sm:px-10">
      <header className="border-b border-hairline pb-10">
        <p className="kicker mb-4">Sacred Space</p>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
          From Manan.
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg leading-snug text-ink-secondary">
          Announcements and notes from the leader of the Tribe.
        </p>
        <Link
          href="/messages"
          className="mt-6 inline-block rounded bg-red px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover"
        >
          Chat with Manan / Team →
        </Link>
      </header>

      <div className="divide-y divide-hairline">
        {announcements.map((a, i) => (
          <article key={a.id} className="py-10">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs tabular-nums text-red">
                {String(i + 1).padStart(2, "0")}
              </span>
              {a.publishedAt && (
                <span className="kicker">{fmtDate(a.publishedAt)}</span>
              )}
            </div>
            <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.015em] text-ink">
              {a.title}
            </h2>
            {a.body && (
              <p className="mt-3 text-[17px] leading-[1.7] text-ink-secondary">
                {a.body}
              </p>
            )}
          </article>
        ))}
      </div>

      {announcements.length === 0 && (
        <p className="py-16 text-center text-[17px] text-ink-secondary">
          No announcements yet. This space stays quiet until it matters.
        </p>
      )}
    </main>
  );
}
