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
    <li className="flex items-center justify-between gap-4 py-3.5 px-4 rounded-xl transition-colors hover:bg-surface-hover/70 border border-transparent hover:border-hairline/60">
      <Link href={`/m/${slug}`} className="flex min-w-0 flex-1 items-center gap-3.5 group">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-hairline/80 bg-surface-sunk shadow-inner">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={fullName} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-mono text-[13px] font-semibold text-ink-muted">
              {initials(fullName) || "·"}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink transition-colors group-hover:text-red">{fullName}</span>
          <span className="block truncate font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted mt-0.5">
            {[roleTitle, industry].filter(Boolean).join("  ·  ") || "Participant"}
          </span>
        </div>
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
    <main className="mx-auto w-full max-w-[760px] px-5 pt-8 pb-28 sm:px-8 space-y-8">
      <nav>
        <Link href="/explore" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink">
          ← Explore Members
        </Link>
      </nav>

      <header className="border-b border-hairline/80 pb-6">
        <p className="kicker mb-2 text-red font-semibold">Networking</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Your Circle</h1>
        <p className="mt-2 text-[14px] text-ink-secondary">Manage your private connection requests and trusted contacts.</p>
      </header>

      {/* Requests */}
      <section className="rounded-2xl border border-hairline/80 bg-surface/80 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-red font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red red-dot-pulse" />
            Pending Requests {incoming.length > 0 && <span className="rounded-full bg-red/20 px-2 py-0.5 text-red font-semibold text-[10px]">{incoming.length}</span>}
          </h2>
        </div>
        {incoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline/60 p-6 text-center">
            <p className="text-[13px] text-ink-muted">No pending connection requests.</p>
          </div>
        ) : (
          <ul className="divide-y divide-hairline/60">
            {incoming.map((p) => (
              <PersonRow key={p.id} {...p} action={<ConnectButton profileId={p.id} initialState="incoming" />} />
            ))}
          </ul>
        )}
      </section>

      {/* Accepted connections */}
      <section className="rounded-2xl border border-hairline/80 bg-surface/80 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted font-semibold flex items-center gap-2">
            Connected Members ({connections.length})
          </h2>
        </div>
        {connections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline/60 p-8 text-center">
            <p className="text-2xl mb-2">🤝</p>
            <p className="text-[14px] font-medium text-ink">No connections yet</p>
            <p className="mt-1 text-[13px] text-ink-muted mb-4">Explore the Tribe member directory to connect with founders and creators.</p>
            <Link href="/explore" className="inline-block rounded-xl bg-red px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover">
              Explore Directory →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-hairline/60">
            {connections.map((p) => (
              <PersonRow key={p.id} {...p} action={<ConnectButton profileId={p.id} initialState="connected" allowRemove />} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

