import Link from "next/link";
import { getRoster } from "@/lib/admin";

export default async function AdminOverviewPage() {
  const roster = await getRoster();
  const active = roster.filter((m) => m.status === "active").length;
  const hidden = roster.filter((m) => m.status === "hidden").length;
  const inactive = roster.filter((m) => m.status === "inactive").length;
  const consultants = roster.filter((m) => m.role === "consultant" || m.role === "admin").length;

  const stats = [
    { label: "Members", value: roster.length, href: "/admin/members" },
    { label: "Active", value: active, href: "/admin/members" },
    { label: "Hidden / inactive", value: hidden + inactive, href: "/admin/members" },
    { label: "Consultants", value: consultants, href: "/admin/consultants" },
  ];

  const links = [
    { href: "/admin/members", title: "Roster", hint: "Search, edit, hide, inactivate or remove members." },
    { href: "/admin/consultants", title: "Consultants", hint: "Add consultants and assign designated consultants." },
    { href: "/admin/assets", title: "Asset Manager", hint: "Publish announcements and curate Campus resources." },
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

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-xl border border-hairline bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-hairline-bright"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              {s.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-ink transition-colors group-hover:text-red">
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
    </main>
  );
}
