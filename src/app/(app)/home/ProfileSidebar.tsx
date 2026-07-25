import Link from "next/link";
import { getMyProfileSummary, getHomeStats } from "@/lib/dashboard";
import { initials } from "./widgets/_shared";

const svg = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const QUICK_LINKS = [
  { label: "Connect with Participants", href: "/explore", icon: (<svg width="16" height="16" viewBox="0 0 24 24" {...svg}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>) },
  { label: "Tribe (Groups, Chats & Community)", href: "/groups", icon: (<svg width="16" height="16" viewBox="0 0 24 24" {...svg}><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 21l1.9-5.6a8.5 8.5 0 0 1-.9-3.9A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z" /></svg>) },
  { label: "Sacred Space (Manan Vasa / Team)", href: "/sacred-space", icon: (<svg width="16" height="16" viewBox="0 0 24 24" {...svg}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>) },
  { label: "Referral Rounds (Wednesdays 10–11 AM)", href: "/referral-rounds", icon: (<svg width="16" height="16" viewBox="0 0 24 24" {...svg}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>) },
];

export default async function ProfileSidebar() {
  const [me, stats] = await Promise.all([getMyProfileSummary(), getHomeStats()]);
  const displayName = me.fullName || me.businessName || "Complete your profile";
  const meta = [me.category, me.natureOfBusiness || me.industry].filter(Boolean).join("  •  ");

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <section className="overflow-hidden rounded-2xl border border-hairline bg-surface">
        <div className="h-16 bg-red/10" />
        <div className="flex flex-col items-center px-5 pb-5 text-center">
          <div className="-mt-10 h-20 w-20 overflow-hidden rounded-full border-4 border-surface bg-surface-sunk">
            {me.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.photoUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-lg text-ink-muted">{initials(displayName) || "·"}</div>
            )}
          </div>
          <h2 className="mt-3 text-[18px] font-bold text-ink">{displayName}</h2>
          {me.businessName && <p className="mt-0.5 text-[13px] font-medium text-ink-secondary">{me.businessName}</p>}
          {meta && <p className="mt-0.5 text-[11px] text-ink-muted">{meta}</p>}

          {me.usp && (
            <div className="mt-4 w-full">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Your USP</p>
              <p className="mt-1 text-[13px] italic leading-relaxed text-ink">“{me.usp}”</p>
            </div>
          )}

          <div className="mt-4 flex w-full gap-2">
            <Link href={me.slug ? `/m/${me.slug}` : "/account"} className="flex-1 rounded-lg border border-hairline px-3 py-2 text-center text-[12px] font-semibold text-ink transition-colors hover:border-hairline-bright">View My Profile</Link>
            <Link href="/notifications" className="flex-1 rounded-lg border border-red/30 bg-red/5 px-3 py-2 text-center text-[12px] font-semibold text-red transition-colors hover:bg-red/10">Notifications</Link>
          </div>

          {me.completion < 100 && (
            <div className="mt-4 w-full rounded-xl bg-surface-sunk/60 p-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-ink">Profile {me.completion}% complete</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                <div className="h-full rounded-full bg-red" style={{ width: `${me.completion}%` }} />
              </div>
              <Link href={me.hasIdentity ? "/account/edit" : "/onboarding"} className="mt-2 inline-block text-[12px] font-semibold text-red">Complete Profile →</Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="rounded-2xl border border-hairline bg-surface p-4">
        {[
          { label: "Connections", value: stats.connections, icon: QUICK_LINKS[0].icon },
          { label: "Profile views", value: stats.profileViews, icon: (<svg width="16" height="16" viewBox="0 0 24 24" {...svg}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /></svg>) },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between border-b border-hairline py-2.5 last:border-0">
            <span className="flex items-center gap-2 text-[13px] text-ink-secondary"><span className="text-ink-muted">{s.icon}</span>{s.label}</span>
            <span className="text-[14px] font-bold tabular-nums text-ink">{s.value}</span>
          </div>
        ))}
      </section>

      {/* Quick links */}
      <section className="rounded-2xl border border-hairline bg-surface p-4">
        <p className="mb-2 text-[13px] font-bold text-ink">Quick Links</p>
        <ul className="space-y-1">
          {QUICK_LINKS.map((q) => (
            <li key={q.label}>
              <Link href={q.href} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[12px] text-ink-secondary transition-colors hover:bg-surface-sunk hover:text-ink">
                <span className="text-red">{q.icon}</span>
                <span className="min-w-0 truncate">{q.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
