import Link from "next/link";
import { getRoster, type MemberStatus } from "@/lib/admin";
import RowActions from "./RowActions";

const STATUS_STYLE: Record<MemberStatus, string> = {
  active: "bg-positive/10 text-positive",
  hidden: "bg-surface-sunk text-ink-muted",
  inactive: "bg-red/10 text-red",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
}

export default async function AdminMembersPage({
  searchParams,
}: PageProps<"/admin/members">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const roster = await getRoster(q);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8 sm:px-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="kicker mb-3">Roster</p>
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
            {roster.length} {roster.length === 1 ? "member" : "members"}
          </h1>
        </div>
      </div>

      {/* Search (GET form → ?q=) */}
      <form className="mt-6" action="/admin/members">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name, city, industry, batch…"
          className="w-full max-w-md rounded border border-hairline bg-surface-sunk px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
        />
      </form>

      <div className="mt-6 overflow-x-auto rounded border border-hairline">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline bg-surface-sunk">
              {["Member", "Batch", "Industry / City", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.map((m) => (
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
                  <RowActions id={m.id} status={m.status} />
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
