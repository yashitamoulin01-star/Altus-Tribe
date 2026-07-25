import Link from "next/link";
import { getRoster, type MemberStatus } from "@/lib/admin";
import RowActions from "./RowActions";

const STATUS_STYLE: Record<MemberStatus, string> = {
  active: "bg-ink/10 text-ink",
  hidden: "bg-surface-sunk text-ink-muted",
  inactive: "bg-red-muted text-red",
  pending: "bg-red-muted text-red",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
}

const STATUS_TABS: { value: "" | MemberStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "hidden", label: "Hidden" },
  { value: "inactive", label: "Inactive" },
];

export default async function AdminMembersPage({
  searchParams,
}: PageProps<"/admin/members">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const statusParam = typeof sp.status === "string" ? sp.status : "";
  const status = (["active", "hidden", "inactive", "pending"].includes(statusParam)
    ? statusParam
    : undefined) as MemberStatus | undefined;
  const roster = await getRoster(q, status);

  // Click-to-sort (server-side, shareable URL). Name + Status are the useful keys.
  const sort = sp.sort === "status" ? "status" : "name";
  const dir = sp.dir === "desc" ? "desc" : "asc";
  const sorted = [...roster].sort((a, b) => {
    const av = sort === "status" ? a.status : a.fullName.toLowerCase();
    const bv = sort === "status" ? b.status : b.fullName.toLowerCase();
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
  const sortHref = (col: "name" | "status") => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("sort", col);
    params.set("dir", sort === col && dir === "asc" ? "desc" : "asc");
    return `/admin/members?${params.toString()}`;
  };
  const arrow = (col: "name" | "status") => (sort === col ? (dir === "asc" ? " ↑" : " ↓") : "");

  const tabHref = (value: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value) params.set("status", value);
    const qs = params.toString();
    return qs ? `/admin/members?${qs}` : "/admin/members";
  };

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8 sm:px-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="kicker mb-3">Users</p>
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
            {roster.length} {roster.length === 1 ? "member" : "members"}
            {status ? ` · ${status}` : ""}
          </h1>
        </div>
      </div>

      {/* Search (GET form → ?q=). Keeps the active status filter on submit. */}
      <form className="mt-6" action="/admin/members">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name, city, industry, batch…"
          className="w-full max-w-md rounded-lg border border-hairline bg-surface-sunk px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-muted transition-all duration-200 focus:border-red/50 focus:outline-none focus:ring-4 focus:ring-red/10"
        />
      </form>

      {/* Status filter tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => {
          const active = (t.value || undefined) === status;
          return (
            <Link
              key={t.value || "all"}
              href={tabHref(t.value)}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                active
                  ? "border-red bg-red/10 text-red"
                  : "border-hairline text-ink-muted hover:border-ink-muted hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-hairline">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline bg-surface-sunk">
              <th scope="col" className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                <Link href={sortHref("name")} className="transition-colors hover:text-ink" aria-label="Sort by member name">
                  Member{arrow("name")}
                </Link>
              </th>
              <th scope="col" className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">Batch</th>
              <th scope="col" className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">Industry / City</th>
              <th scope="col" className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                <Link href={sortHref("status")} className="transition-colors hover:text-ink" aria-label="Sort by status">
                  Status{arrow("status")}
                </Link>
              </th>
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr key={m.id} className="border-b border-hairline last:border-0 hover:bg-surface-sunk/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/members/${m.id}`} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunk font-mono text-[11px] text-ink-muted">
                      {m.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.photoUrl} alt={m.fullName} className="h-full w-full object-cover" />
                      ) : (
                        initials(m.fullName)
                      )}
                    </span>
                    <span>
                      <span className="block text-[15px] font-medium text-ink">{m.fullName}</span>
                      <span className="block font-mono text-[11px] text-ink-muted">
                        {m.role}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-ink-secondary">
                  {[m.cqBatch, m.psBatch].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">
                  {[m.industry, m.city].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${STATUS_STYLE[m.status]}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <RowActions id={m.id} status={m.status} featured={m.featured} />
                </td>
              </tr>
            ))}
            {roster.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[15px] text-ink-secondary">
                  No members match that.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
