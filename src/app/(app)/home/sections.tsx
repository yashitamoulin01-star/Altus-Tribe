import Link from "next/link";
import { getMyProfileSummary, getSuggestedMembers } from "@/lib/dashboard";
import { getUpcomingEvents, getNextReferralRound } from "@/lib/events";
import ReferralRoundCard from "./ReferralRoundCard";
import { getAnnouncements } from "@/lib/community";
import { getNotifications } from "@/lib/notifications";
import { initials } from "./widgets/_shared";

// ── UI-3 Home Sections — REAL DATA ONLY (no fake participants / stock images).
// Missing data → honest empty states. Palette: red/white/grey/black.

const linkPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red px-5 text-[13px] font-semibold text-white transition-all hover:bg-red-hover active:scale-95 shadow-sm shadow-red/20";
const linkSecondary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-hairline bg-white px-5 text-[13px] font-semibold text-ink transition-all hover:border-hairline-bright hover:bg-surface-sunk active:scale-95 dark:bg-surface";

function SectionHead({ title, href, cta = "See all →" }: { title: string; href?: string; cta?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[17px] font-bold text-ink sm:text-[19px] tracking-tight">{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-[13px] font-semibold text-red transition-colors hover:text-red-hover">
          {cta}
        </Link>
      )}
    </div>
  );
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── 1. IDENTITY — vertical profile card (compact height) ────────────────────
export async function IdentityHero() {
  const me = await getMyProfileSummary();
  const displayName = me.fullName || me.businessName || "Complete your profile";
  const meta = [me.category, me.natureOfBusiness || me.industry].filter(Boolean).join(" • ");
  const pct = Math.max(0, Math.min(100, me.completion ?? 0));

  return (
    <section className="eco-card flex h-full flex-col overflow-hidden">
      {/* red header band with overlapping avatar */}
      <div className="relative h-10 bg-gradient-to-b from-red/12 to-transparent">
        <div className="absolute left-1/2 top-3 -translate-x-1/2">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-paper bg-red text-[15px] font-bold text-white shadow-sm">
            {me.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.photoUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initials(displayName) || "·"
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-10 text-center">
        <h2 className="text-[17px] font-bold leading-tight text-ink sm:text-[19px]">{displayName}</h2>
        {meta && <p className="mt-0.5 text-[12px] text-ink-muted">{meta}</p>}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href={me.slug ? `/m/${me.slug}` : "/account"} className="flex items-center justify-center rounded-xl border border-hairline bg-white px-2 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-hairline-bright dark:bg-surface">
            View My Profile
          </Link>
          <Link href="/notifications" className="flex items-center justify-center rounded-xl border border-red/25 bg-red/5 px-2 py-2 text-[13px] font-semibold text-red transition-colors hover:bg-red/10">
            Notifications
          </Link>
        </div>

        <div className="mt-3 rounded-xl bg-surface-sunk/60 p-3 text-left">
          <p className="text-[12px] font-semibold text-ink">Profile {pct}% complete</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
            <div className="h-full rounded-full bg-red transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <Link href="/account/edit" className="mt-2 inline-block text-[12px] font-semibold text-red hover:underline">
            Complete Profile →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── 2. ANNOUNCEMENTS — real, pinned-first, no stock image ───────────────────
export async function HomeAnnouncements() {
  const items = (await getAnnouncements()).slice(0, 4);
  const [lead, ...rest] = items;

  return (
    <section className="eco-card relative overflow-hidden p-6 sm:p-8">
      {/* vibrant-red accent wash for prominence */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ background: "radial-gradient(38rem 22rem at 100% 0%, #e11d2a, transparent 55%)" }} />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red text-white shadow-sm shadow-red/40">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            </span>
            <h2 className="text-[20px] font-bold tracking-tight text-ink sm:text-[24px]">Announcements from Manan Vasa</h2>
          </div>
          <Link href="/sacred-space" className="shrink-0 text-[13px] font-semibold text-red transition-colors hover:text-red-hover">See all →</Link>
        </div>

        {!lead ? (
          <p className="text-[14px] text-ink-muted">No announcements yet.</p>
        ) : (
          <div className="space-y-4">
            {/* lead — large, red-accented card */}
            <article className="rounded-2xl border border-red/20 bg-gradient-to-br from-red/[0.06] to-transparent p-5">
              <div className="flex items-center gap-2">
                {lead.pinnedAt && <span className="rounded-md bg-red px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-sm shadow-red/30">Pinned</span>}
                <span className="text-[11px] font-medium text-ink-muted">{fmtDate(lead.publishedAt)}</span>
              </div>
              <h3 className="mt-2 text-[18px] font-bold text-ink sm:text-[20px]">{lead.title}</h3>
              {lead.body && <p className="mt-1.5 text-[14px] leading-relaxed text-ink-secondary">{lead.body}</p>}
            </article>

            {rest.length > 0 && (
              <ul className="divide-y divide-hairline">
                {rest.map((a) => (
                  <li key={a.id} className="py-3 first:pt-1">
                    <p className="flex items-center gap-2 text-[15px] font-bold text-ink">
                      <span className="truncate">{a.title}</span>
                      {a.pinnedAt && <span className="shrink-0 rounded-md bg-red/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-red">Pinned</span>}
                    </p>
                    {a.body && <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-ink-secondary">{a.body}</p>}
                    <p className="mt-1 text-[11px] text-ink-muted">{fmtDate(a.publishedAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ── 3. NETWORKING ACTIONS ───────────────────────────────────────────────────
export function NetworkingActions() {
  const actions = [
    { title: "Connect with Participants", sub: "Discover participants by business, category and expertise.", href: "/explore",
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>) },
    { title: "Tribe", sub: "Join conversations, groups and networking activity.", href: "/groups",
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>) },
    { title: "Sacred Space", sub: "Reach Manan Vasa / Team and view important updates.", href: "/sacred-space",
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>) },
    { title: "Referral Rounds", sub: "Build consistent referral relationships inside the Tribe.", href: "/referral-rounds",
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>) },
    { title: "Campus", sub: "Explore videos, learning and the PS ecosystem.", href: "/campus",
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>) },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-[17px] font-bold text-ink sm:text-[19px] tracking-tight">What would you like to do?</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((act) => (
          <Link key={act.title} href={act.href} className="group eco-card relative flex flex-col justify-between p-4 transition-all hover:border-hairline-bright hover:shadow-md">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red text-white shadow-sm shadow-red/20">{act.icon}</div>
              <h3 className="mt-3 text-[14px] font-bold text-ink group-hover:text-red transition-colors">{act.title}</h3>
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-muted">{act.sub}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-[13px] text-ink-muted group-hover:translate-x-1 transition-transform group-hover:text-red">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Referral Rounds — server-fetches the next scheduled round (admin-set or the
// standing Wednesday) and hands the date to the client countdown card.
export async function ReferralRoundSection() {
  const rr = await getNextReferralRound();
  return <ReferralRoundCard startsAt={rr.startsAt} title={rr.title} location={rr.location} link={rr.link} />;
}

// ── Sacred Space card — reach Manan Vasa / Team ─────────────────────────────
export function SacredSpaceCard() {
  return (
    <section className="eco-card flex flex-col justify-between p-5 sm:p-6">
      <div>
        <SectionHead title="Sacred Space" href="/sacred-space" cta="Open →" />
        <div className="mt-2 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red/10 text-red">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-ink">Manan Vasa / Team</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">Reach Manan Vasa and the team, and see important updates.</p>
          </div>
        </div>
      </div>
      <Link href="/sacred-space" className={linkSecondary + " mt-5 w-full"}>Enter Sacred Space</Link>
    </section>
  );
}

// ── 4. NEXT CONCLAVE — real events only ─────────────────────────────────────
export async function ConclaveCard() {
  const events = await getUpcomingEvents(3);
  const ev = events.find((e) => e.featured) ?? events[0];

  return (
    <section className="eco-card flex flex-col justify-between p-5 sm:p-6">
      <div>
        <SectionHead title="Next Altus Conclave" href="/campus" />
        {ev ? (
          <div className="mt-2 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="min-w-0 flex-1 space-y-1.5">
              <h3 className="text-[17px] font-bold text-ink">{ev.title}</h3>
              <p className="text-[13px] font-medium text-red">{fmtDate(ev.startsAt)}</p>
              {ev.location && (
                <p className="flex items-center gap-1 text-[12px] text-ink-muted">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  {ev.location}
                </p>
              )}
              {ev.description && <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink-secondary">{ev.description}</p>}
            </div>
            <div className="grid h-28 w-full shrink-0 place-items-center rounded-xl border border-hairline bg-surface-sunk text-red sm:w-32" aria-hidden>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-[13px] text-ink-muted">No upcoming events scheduled yet — check back soon.</p>
        )}
      </div>
      <div className="mt-5 pt-1">
        {ev?.link ? (
          <a href={ev.link} target="_blank" rel="noopener noreferrer" className={linkPrimary + " w-full"}>Register</a>
        ) : (
          <Link href="/campus" className={linkSecondary + " w-full"}>View Event Details</Link>
        )}
      </div>
    </section>
  );
}

// ── 5. TODAY'S NETWORK — real participants only, honest empty state ─────────
export async function TodaysNetwork() {
  const people = await getSuggestedMembers(4);

  return (
    <section className="eco-card flex flex-col p-5 sm:p-6">
      <SectionHead title="People you should connect with" href="/explore" />
      {people.length === 0 ? (
        <p className="text-[13px] text-ink-muted">No participants to suggest yet — explore the full directory.</p>
      ) : (
        <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((m) => (
            <Link key={m.slug} href={`/m/${m.slug}`} className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-sunk/40 p-2.5 transition-all hover:border-hairline-bright hover:bg-surface-sunk">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-hairline bg-white">
                {m.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photoUrl} alt={m.fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[12px] font-bold text-ink-muted">{initials(m.fullName)}</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-ink">{m.fullName}</p>
                {m.businessName && <p className="truncate text-[11px] font-medium text-ink-secondary">{m.businessName}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

// ── 6. RECENT ACTIVITY — real notifications ─────────────────────────────────
export async function RecentActivity() {
  const items = (await getNotifications()).slice(0, 4);

  return (
    <section className="eco-card flex flex-col p-5 sm:p-6">
      <SectionHead title="Recent Activity" href="/notifications" />
      {items.length === 0 ? (
        <p className="text-[13px] text-ink-muted">You&apos;re all caught up.</p>
      ) : (
        <div className="mt-1 divide-y divide-hairline">
          {items.map((n) => (
            <Link key={n.id} href={n.link || "/notifications"} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 group">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${n.read ? "bg-surface-sunk text-ink-muted" : "bg-red/10 text-red"}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /></svg>
                </span>
                <p className="truncate text-[13px] font-semibold text-ink group-hover:text-red">{n.title}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-[11px] text-ink-muted">{fmtDate(n.createdAt)}</span>
                {!n.read && <span className="h-2 w-2 rounded-full bg-red" />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

// ── 7. INSPIRATION CORNER — self-hides until real Inspiration content exists ─
export function InspirationCorner() {
  // No public Inspiration/Wins publication model yet — hidden (no fake stories).
  return null;
}

// ── 8. ELEVATOR PITCHES — self-hides until real pitch data exists ───────────
export function ElevatorPitches() {
  // No elevator-pitch storage yet — hidden (no fake people / stock video tiles).
  return null;
}

// Legacy exports kept for backwards compatibility.
export async function EcosystemShortcuts() {
  return null;
}
export async function InspirationHighlights() {
  return null;
}
