import Link from "next/link";
import { getIncomingRequests, getConnections } from "@/lib/connections";
import ConnectButton from "@/components/ConnectButton";

export const metadata = { title: "Connections — Altus Tribe" };
export const dynamic = "force-dynamic";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
}

function PersonRow({
  slug,
  fullName,
  photoUrl,
  roleTitle,
  industry,
  action,
}: {
  slug: string;
  fullName: string;
  photoUrl: string | null;
  roleTitle: string;
  industry: string;
  action: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Link href={`/m/${slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-sunk">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-mono text-[12px] text-ink-muted">
              {initials(fullName) || "·"}
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium text-ink">{fullName}</span>
          <span className="block truncate font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
            {[roleTitle, industry].filter(Boolean).join("  ·  ")}
          </span>
        </span>
      </Link>
      <div className="shrink-0">{action}</div>
    </li>
  );
}

export default async function ConnectionsPage() {
  const [incoming, connections] = await Promise.all([
    getIncomingRequests(),
    getConnections(),
  ]);

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 pt-8 pb-24 sm:px-8">
      <nav className="mb-6">
        <Link href="/explore" className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink">
          ← Explore
        </Link>
      </nav>

      <header className="border-b border-hairline pb-6">
        <p className="kicker mb-3">Connections</p>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">Your circle.</h1>
      </header>

      {/* Requests */}
      <section className="pt-8">
        <h2 className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-red">
          Requests{incoming.length > 0 ? ` · ${incoming.length}` : ""}
        </h2>
        {incoming.length === 0 ? (
          <p className="py-4 text-[14px] text-ink-muted">No pending requests.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {incoming.map((p) => (
              <PersonRow key={p.id} {...p} action={<ConnectButton profileId={p.id} initialState="incoming" />} />
            ))}
          </ul>
        )}
      </section>

      {/* Accepted connections */}
      <section className="mt-8 border-t border-hairline pt-8">
        <h2 className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          Connected{connections.length > 0 ? ` · ${connections.length}` : ""}
        </h2>
        {connections.length === 0 ? (
          <p className="py-4 text-[14px] text-ink-muted">
            No connections yet. Explore the Tribe and send a request.
          </p>
        ) : (
          <ul className="divide-y divide-hairline">
            {connections.map((p) => (
              <PersonRow key={p.id} {...p} action={<ConnectButton profileId={p.id} initialState="connected" allowRemove />} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
