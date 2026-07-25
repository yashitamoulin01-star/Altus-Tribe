import Link from "next/link";
import { getMyProfileSummary, getSuggestedMembers } from "@/lib/dashboard";
import { getUpcomingEvents, getNextReferralRound } from "@/lib/events";
import ReferralRoundCard from "./ReferralRoundCard";
import { getAnnouncements } from "@/lib/community";
import { getNotifications, getUnreadCount } from "@/lib/notifications";
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

// ── 1. IDENTITY HERO — the signed-in participant, real data ─────────────────
export async function IdentityHero() {
  const [me, unread] = await Promise.all([getMyProfileSummary(), getUnreadCount()]);
  const displayName = me.fullName || me.businessName || "Complete your profile";
  const first = me.fullName ? me.fullName.split(" ")[0] : "there";
  const meta = [me.category, me.natureOfBusiness || me.industry].filter(Boolean).join("  •  ");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[24px] font-bold text-ink sm:text-[28px] tracking-tight">
          Welcome back, {first}
        </h1>
        <p className="mt-0.5 text-[14px] text-ink-secondary">Let&apos;s build meaningful connections today.</p>
      </div>

      <section className="eco-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
          <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-full border-2 border-hairline bg-surface-sunk sm:h-20 sm:w-20">
            {me.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.photoUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-sans text-lg font-bold text-ink-muted">
                {initials(displayName) || "·"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] font-bold text-ink sm:text-[20px]">{displayName}</h2>
              <span className="rounded-full bg-red/10 px-2.5 py-0.5 text-[11px] font-bold text-red uppercase tracking-wider">
                Participant
              </span>
            </div>
            {me.businessName && <p className="mt-0.5 text-[14px] font-semibold text-ink-secondary">{me.businessName}</p>}
            {meta && <p className="mt-1 text-[12px] text-ink-muted">{meta}</p>}
          </div>
        </div>

        {me.usp ? (
          <div className="mt-4 rounded-xl border border-hairline bg-surface-sunk/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">My USP</p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink font-medium">“{me.usp}”</p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-hairline p-4">
            <p className="text-[13px] text-ink-muted">
              Add your USP so the Tribe understands your business value.{" "}
              <Link href="/account/edit" className="font-semibold text-red">Add it →</Link>
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href={me.slug ? `/m/${me.slug}` : "/account"} className={linkSecondary}>
            View My Profile
          </Link>
          <Link href="/notifications" className={linkPrimary + " relative"}>
            Notifications
            {unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-red">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── 2. ANNOUNCEMENTS — real, pinned-first, no stock image ───────────────────
export async function HomeAnnouncements() {
  const items = (await getAnnouncements()).slice(0, 3);

  return (
    <section className="eco-card flex flex-col p-5 sm:p-6">
      <SectionHead title="Announcements from Manan Vasa" href="/sacred-space" />
      {items.length === 0 ? (
        <p className="text-[13px] text-ink-muted">No announcements yet.</p>
      ) : (
        <ul className="divide-y divide-hairline">
          {items.map((a) => (
            <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[14px] font-bold text-ink">
                  <span className="truncate">{a.title}</span>
                  {a.pinnedAt && <span className="shrink-0 rounded-md bg-red/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-red">Pinned</span>}
                </p>
                {a.body && <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-ink-secondary">{a.body}</p>}
                <p className="mt-1 text-[11px] text-ink-muted">{fmtDate(a.publishedAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── 3. NETWORKING ACTIONS ───────────────────────────────────────────────────
export function NetworkingActions() {
  const actions = [
    { title: "Connect with Participants", sub: "Discover participants by business, category and expertise.", href: "/explore",
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>) },
    { title: "Tribe", sub: "Join conversations, groups and networking activity.", href: "/messages",
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
      <SectionHead title="Today's Network" href="/explore" />
      {people.length === 0 ? (
        <p className="text-[13px] text-ink-muted">No participants to suggest yet — explore the full directory.</p>
      ) : (
        <div className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {people.map((m) => (
            <Link key={m.slug} href={`/m/${m.slug}`} className="flex flex-col items-center rounded-xl border border-hairline bg-surface-sunk/40 p-3 text-center transition-all hover:bg-surface-sunk hover:border-hairline-bright">
              <div className="h-14 w-14 overflow-hidden rounded-full border border-hairline bg-white">
                {m.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photoUrl} alt={m.fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-[13px] text-ink-muted">{initials(m.fullName)}</div>
                )}
              </div>
              <p className="mt-2 w-full truncate text-[13px] font-bold text-ink">{m.fullName}</p>
              {m.businessName && <p className="w-full truncate text-[11px] font-medium text-ink-secondary">{m.businessName}</p>}
              {m.category && <p className="w-full truncate text-[10px] text-ink-muted">{m.category}</p>}
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
