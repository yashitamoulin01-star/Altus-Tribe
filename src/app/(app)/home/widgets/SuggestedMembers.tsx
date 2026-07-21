import Link from "next/link";
import { getSuggestedMembers } from "@/lib/dashboard";
import { Card, WidgetHeader, Avatar, EmptyNote } from "./_shared";

// People worth knowing — surfaced by industry (PRD Explore/#9). View or message
// via the member's feature, which carries the real DM action.
export default async function SuggestedMembers() {
  const members = await getSuggestedMembers(4);

  return (
    <Card>
      <WidgetHeader title="Suggested connections" href="/explore" cta="Explore" />
      {members.length === 0 ? (
        <EmptyNote>No suggestions yet.</EmptyNote>
      ) : (
        <ul className="divide-y divide-hairline">
          {members.map((m) => (
            <li key={m.slug} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar url={m.photoUrl} name={m.fullName} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-ink">{m.fullName}</p>
                <p className="truncate font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                  {[m.roleTitle || m.businessName, m.industry].filter(Boolean).join("  ·  ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/m/${m.slug}`} className="rounded-lg border border-hairline px-3 py-1.5 text-[13px] text-ink transition-colors hover:border-ink-muted">
                  View
                </Link>
                <Link href={`/m/${m.slug}`} className="rounded-lg bg-red px-3 py-1.5 text-[13px] font-medium text-paper transition-colors hover:bg-red-hover">
                  Message
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
