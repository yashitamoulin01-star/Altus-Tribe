import Link from "next/link";

const ACTIONS: { label: string; desc: string; href: string; icon: string }[] = [
  { label: "Explore Members", desc: "Discover the Tribe", href: "/explore", icon: "🔍" },
  { label: "Tribe Chat", desc: "1:1 & group chats", href: "/messages", icon: "💬" },
  { label: "Sacred Space", desc: "Manan & the team", href: "/sacred-space", icon: "🏛️" },
  { label: "Campus", desc: "Videos & learning", href: "/campus", icon: "🎓" },
  { label: "Referral Rounds", desc: "Every Wednesday", href: "/refer", icon: "🤝" },
  { label: "Announcements", desc: "Latest updates", href: "/sacred-space", icon: "📢" },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {ACTIONS.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className="group relative overflow-hidden rounded-xl border border-hairline/80 bg-surface/80 p-3.5 backdrop-blur-md transition-all duration-300 hover:border-red/50 hover:bg-surface-hover hover:shadow-lg hover:shadow-red/5"
        >
          <div className="mb-2 text-lg transition-transform duration-200 group-hover:scale-110">
            {a.icon}
          </div>
          <p className="text-[13px] font-semibold text-ink truncate">{a.label}</p>
          <p className="mt-0.5 text-[11px] text-ink-muted truncate">{a.desc}</p>
          <div className="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="text-red font-mono text-xs">→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

