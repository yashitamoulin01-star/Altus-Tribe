import Link from "next/link";

// Entry points into each module — the dashboard is a hub, not a container.
// (No data fetch; static navigation.)
const ACTIONS: { label: string; desc: string; href: string }[] = [
  { label: "Explore Members", desc: "Discover the Tribe", href: "/explore" },
  { label: "Tribe Chat", desc: "1:1 & group chats", href: "/messages" },
  { label: "Sacred Space", desc: "Manan & the team", href: "/sacred-space" },
  { label: "Campus", desc: "Videos & learning", href: "/campus" },
  { label: "Referral Rounds", desc: "Every Wednesday", href: "/refer" },
  { label: "Announcements", desc: "Latest updates", href: "/sacred-space" },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {ACTIONS.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className="group rounded-xl border border-hairline bg-surface p-4 transition-colors hover:border-ink-muted"
        >
          <p className="text-[15px] font-medium text-ink">{a.label}</p>
          <p className="mt-1 text-[13px] text-ink-muted">{a.desc}</p>
          <span className="mt-3 inline-block text-[13px] text-red opacity-0 transition-opacity group-hover:opacity-100">
            Open →
          </span>
        </Link>
      ))}
    </div>
  );
}
