import Link from "next/link";
import { getRoster, getRecentSignups } from "@/lib/admin";

function relDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_CHIP: Record<string, string> = {
  active: "bg-ink/10 text-ink",
  hidden: "bg-surface-sunk text-ink-muted",
  inactive: "bg-red-muted text-red",
  pending: "bg-red-muted text-red",
};

export default async function AdminOverviewPage() {
  const [roster, recent] = await Promise.all([getRoster(), getRecentSignups(8)]);
  const active = roster.filter((m) => m.status === "active").length;
  const hidden = roster.filter((m) => m.status === "hidden").length;
  const inactive = roster.filter((m) => m.status === "inactive").length;
  const pending = roster.filter((m) => m.status === "pending").length;
  const consultants = roster.filter((m) => m.role === "consultant" || m.role === "admin").length;

  const stats = [
    // Pending approvals leads the row so it's the first thing an admin triages;
    // accented red while anyone is waiting, muted when the queue is clear.
    { label: "Pending approvals", value: pending, href: "/admin/approvals", accent: pending > 0 },
    { label: "Members", value: roster.length, href: "/admin/members" },
    { label: "Active", value: active, href: "/admin/members?status=active" },
    { label: "Hidden / inactive", value: hidden + inactive, href: "/admin/members?status=hidden" },
    { label: "Consultants", value: consultants, href: "/admin/consultants" },
  ];

  const links = [
    { href: "/admin/members", title: "Roster", hint: "Search, edit, hide, inactivate or remove members." },
    { href: "/admin/inbox", title: "Sacred Space inbox", hint: "Read and reply to in-app support threads from members." },
    { href: "/admin/consultants", title: "Consultants", hint: "Add consultants and assign designated consultants." },
    { href: "/admin/assets", title: "Asset Manager", hint: "Publish announcements and curate Campus resources." },
    { href: "/admin/taxonomies", title: "Categories", hint: "Curate the industry / category dropdowns and filters." },
    { href: "/admin/events", title: "Events", hint: "Schedule conclaves, referral rounds and orientations." },
    { href: "/admin/analytics", title: "Analytics", hint: "Members, engagement, and content at a glance." },
    { href: "/admin/import", title: "Bulk import", hint: "Upload a CSV/Excel, map columns, confirm." },
    { href: "/admin/exports", title: "Exports & outreach", hint: "Excel / PDF master DB; WhatsApp / Email." },
  ];

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Admin</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Quietly well-run.
      </h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`group rounded-xl border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 ${
              s.accent ? "border-red/40 hover:border-red/70" : "border-hairline hover:border-hairline-bright"
            }`}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              {s.label}
            </p>
            <p
              className={`mt-2 text-3xl font-semibold tabular-nums transition-colors ${
                s.accent ? "text-red" : "text-ink group-hover:text-red"
              }`}
            >
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group rounded-xl border border-hairline bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-hairline-bright"
          >
            <p className="text-lg font-semibold text-ink transition-colors group-hover:text-red">
              {l.title}
            </p>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-secondary">{l.hint}</p>
          </Link>
        ))}
      </div>

      {/* Recent signups */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
            Recent signups
          </h2>
          <Link href="/admin/members" className="text-[13px] text-red transition-colors hover:text-red-hover">
            All members →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-xl border border-hairline px-4 py-8 text-center text-[14px] text-ink-secondary">
            No members yet. New signups will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-hairline rounded-xl border border-hairline">
            {recent.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/members/${m.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-hover"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium text-ink">{m.fullName}</span>
                    <span className="mt-0.5 block font-mono text-[11px] text-ink-muted">
                      {m.role} · joined {relDate(m.joinedAt)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {!m.completed && (
                      <span className="rounded bg-surface-sunk px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                        Setup pending
                      </span>
                    )}
                    <span className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${STATUS_CHIP[m.status] ?? "bg-surface-sunk text-ink-muted"}`}>
                      {m.status}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
