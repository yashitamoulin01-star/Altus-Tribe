import { getConclaveAttendees } from "@/lib/conclave-attendees";

export const metadata = { title: "Conclave Directory — Altus Tribe Admin" };
export const dynamic = "force-dynamic";

function waLink(phone: string) {
  const d = phone.replace(/[^0-9]/g, "");
  const withCc = d.length === 10 ? `91${d}` : d;
  return `https://wa.me/${withCc}`;
}

export default async function AdminConclavePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await getConclaveAttendees();
  const query = q.trim().toLowerCase();
  const rows = query
    ? all.filter((a) =>
        [a.fullName, a.email, a.phone, a.business, a.conclave]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(query)),
      )
    : all;

  // Group counts by conclave edition.
  const byEdition = new Map<string, number>();
  for (const a of all) {
    const k = a.conclave ?? "—";
    byEdition.set(k, (byEdition.get(k) ?? 0) + 1);
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Conclave Directory</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        {all.length} attendees
      </h1>
      <p className="mt-2 max-w-[60ch] text-[15px] text-ink-secondary">
        Registrations and contacts from Altus Conclave editions. Admin-only — this
        directory is never shown to members.
      </p>

      {byEdition.size > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {[...byEdition.entries()].map(([ed, n]) => (
            <span key={ed} className="rounded-full border border-hairline px-3 py-1 font-mono text-[11px] text-ink-muted">
              {ed} · {n}
            </span>
          ))}
        </div>
      )}

      <form className="mt-6" action="/admin/conclave">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name, business, email, phone…"
          className="w-full max-w-md rounded-lg border border-hairline bg-surface-sunk px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus:border-red/50 focus:outline-none focus:ring-4 focus:ring-red/10"
        />
      </form>

      {all.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-hairline px-4 py-12 text-center text-[15px] text-ink-secondary">
          No attendees loaded yet. Run the conclave seed in Supabase (kept out of
          the repo), or import via Admin → Import.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-hairline">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline bg-surface-sunk">
                {["Name", "Business", "Email", "Phone", "Conclave"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-hairline last:border-0 hover:bg-surface-sunk/50">
                  <td className="px-4 py-3 text-[15px] font-medium text-ink">{a.fullName}</td>
                  <td className="px-4 py-3 text-[13px] text-ink-secondary">{a.business || "—"}</td>
                  <td className="px-4 py-3 text-[13px]">
                    {a.email ? <a href={`mailto:${a.email}`} className="text-red hover:text-red-hover">{a.email}</a> : <span className="text-ink-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[13px]">
                    {a.phone ? <a href={waLink(a.phone)} target="_blank" rel="noopener noreferrer" className="text-red hover:text-red-hover">{a.phone}</a> : <span className="text-ink-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">{a.conclave || "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[14px] text-ink-secondary">No attendees match that.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
