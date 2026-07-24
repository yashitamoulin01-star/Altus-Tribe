import Link from "next/link";
import { getMyProfileSummary, getSuggestedMembers } from "@/lib/dashboard";
import { getUpcomingEvents } from "@/lib/events";
import { getAnnouncements } from "@/lib/community";
import { getPublicSettings } from "@/lib/settings";
import { PS_APP_URL } from "@/lib/settings-meta";
import { EcosystemCard } from "@/components/ui/EcosystemCard";
import { initials } from "./widgets/_shared";

// ── UI-3 Home sections (light-first, PS ecosystem language, real data only) ──

const linkPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-red px-4 text-[13px] font-medium text-white transition-colors hover:bg-red-hover";
const linkSecondary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-hairline bg-surface px-4 text-[13px] font-medium text-ink transition-colors hover:border-hairline-bright";

function SectionHead({ title, href, cta = "View all" }: { title: string; href?: string; cta?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="t-section text-ink">{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-[13px] font-medium text-red transition-colors hover:text-red-hover">
          {cta} →
        </Link>
      )}
    </div>
  );
}

const svg = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const IconUsers = (<svg width="20" height="20" viewBox="0 0 24 24" {...svg} aria-hidden><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" /><path d="M16.5 5.2a3 3 0 0 1 0 5.6M18 20c0-2.2-.8-3.9-2-5" /></svg>);
const IconTribe = (<svg width="20" height="20" viewBox="0 0 24 24" {...svg} aria-hidden><circle cx="12" cy="7" r="3" /><circle cx="5.5" cy="16" r="2.5" /><circle cx="18.5" cy="16" r="2.5" /><path d="M9.5 8.8 7 13.5M14.5 8.8 17 13.5M8 16h8" /></svg>);
const IconSacred = (<svg width="20" height="20" viewBox="0 0 24 24" {...svg} aria-hidden><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 21l1.9-5.6a8.5 8.5 0 0 1-.9-3.9A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z" /></svg>);
const IconRepeat = (<svg width="20" height="20" viewBox="0 0 24 24" {...svg} aria-hidden><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>);
const IconGrid = (<svg width="18" height="18" viewBox="0 0 24 24" {...svg} aria-hidden><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>);

// A. Participant identity + USP ------------------------------------------------
export async function IdentityHero() {
  const me = await getMyProfileSummary();
  const first = (me.fullName || me.displayName || "there").split(" ")[0];
  const meta = [me.category, me.natureOfBusiness].filter(Boolean).join("  ·  ");
  return (
    <section className="eco-card p-6 sm:p-7">
      <p className="t-caption">Welcome back,</p>
      <h1 className="t-page-title mt-0.5 text-ink">{first}</h1>

      <div className="mt-5 flex items-start gap-4 sm:gap-5">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-hairline bg-surface-sunk sm:h-24 sm:w-24">
          {me.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.photoUrl} alt={me.fullName || "Profile photo"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-xl text-ink-muted">
              {initials(me.fullName || me.businessName || "") || "·"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate t-section text-ink">{me.fullName || me.businessName || "Complete your profile"}</p>
          {me.businessName && <p className="mt-0.5 truncate text-[14px] text-ink-secondary">{me.businessName}</p>}
          {meta && <p className="mt-1 truncate t-caption">{meta}</p>}
        </div>
      </div>

      {me.usp ? (
        <div className="mt-5 rounded-xl border border-hairline bg-surface-sunk/60 p-4">
          <p className="t-label text-red">Your USP</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink">“{me.usp}”</p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-hairline p-4">
          <p className="text-[13px] text-ink-muted">
            Add your USP so the Tribe understands your business value.{" "}
            <Link href="/account/edit" className="font-medium text-red">Add it →</Link>
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Link href={me.slug ? `/m/${me.slug}` : "/account"} className={linkPrimary}>View my profile</Link>
        <Link href="/notifications" className={linkSecondary}>Notifications</Link>
      </div>
    </section>
  );
}

// B. Primary networking actions ------------------------------------------------
export function NetworkingActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:row-span-2">
        <EcosystemCard href="/explore" title="Connect with Participants" description="Discover participants by business, category and expertise." icon={IconUsers} />
      </div>
      <EcosystemCard href="/explore" title="Tribe" description="Join conversations, groups and networking activity." icon={IconTribe} />
      <EcosystemCard href="/sacred-space" title="Sacred Space" description="Connect privately with Manan Vasa / Team and view important communication." icon={IconSacred} />
      <div className="md:col-span-2">
        <EcosystemCard href="/refer" title="Referral Rounds" description="Build consistent referral relationships inside the Tribe." icon={IconRepeat} />
      </div>
    </div>
  );
}

// D. Next Altus Conclave (existing Events architecture) ------------------------
export async function ConclaveCard() {
  const events = await getUpcomingEvents(3);
  const ev = events.find((e) => e.featured) ?? events[0];
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  };
  return (
    <section className="eco-card flex h-full flex-col p-5">
      <p className="t-label text-ink-muted">Upcoming</p>
      {ev ? (
        <>
          <h3 className="mt-1 t-card-title text-ink">{ev.title}</h3>
          <p className="mt-1 text-[13px] text-ink-secondary">
            {fmt(ev.startsAt)}{ev.location ? `  ·  ${ev.location}` : ""}
          </p>
          {ev.description && <p className="mt-2 line-clamp-2 text-[13px] text-ink-muted">{ev.description}</p>}
          <div className="mt-auto pt-4">
            {ev.link ? (
              <a href={ev.link} target="_blank" rel="noopener noreferrer" className={linkPrimary}>Register</a>
            ) : (
              <Link href="/campus" className={linkSecondary}>View details</Link>
            )}
          </div>
        </>
      ) : (
        <p className="mt-2 text-[13px] text-ink-muted">No upcoming events scheduled yet — check back soon.</p>
      )}
    </section>
  );
}

// E. Today's Network (real participants). Extension point for future AI modes:
// pass a future `mode` ("discover" | "recommended" | "gatekeepers") to swap the
// title + the source query WITHOUT changing this card layout. Only "discover"
// (honest, no AI) is implemented today.
export async function TodaysNetwork() {
  const people = await getSuggestedMembers(4);
  if (people.length === 0) return null;
  return (
    <section>
      <SectionHead title="Today's Network" href="/explore" cta="View all participants" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {people.map((m) => (
          <div key={m.slug} className="eco-card flex flex-col p-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-hairline bg-surface-sunk">
                {m.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photoUrl} alt={m.fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-mono text-[12px] text-ink-muted">{initials(m.fullName)}</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-ink">{m.fullName}</p>
                <p className="truncate t-caption">{[m.businessName, m.category].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            {m.positioning && (
              <p className="mt-3 line-clamp-2 text-[13px] leading-snug text-ink-secondary">{m.positioning}</p>
            )}
            <div className="mt-auto flex gap-2 pt-4">
              <Link href={`/m/${m.slug}`} className="flex-1 rounded-lg border border-hairline px-3 py-1.5 text-center text-[12px] font-medium text-ink transition-colors hover:border-hairline-bright">View</Link>
              <Link href={`/m/${m.slug}`} className="flex-1 rounded-lg bg-red px-3 py-1.5 text-center text-[12px] font-medium text-white transition-colors hover:bg-red-hover">Message</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// F. Announcements from Manan Vasa (existing system, pinned-first) -------------
export async function HomeAnnouncements() {
  const items = (await getAnnouncements()).slice(0, 3);
  return (
    <section className="eco-card p-5">
      <SectionHead title="Announcements from Manan Vasa" href="/sacred-space" />
      {items.length === 0 ? (
        <p className="text-[13px] text-ink-muted">No announcements yet.</p>
      ) : (
        <ul className="divide-y divide-hairline">
          {items.map((a) => (
            <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[14px] font-medium text-ink">
                  <span className="truncate">{a.title}</span>
                  {a.pinnedAt && <span className="shrink-0 rounded bg-red/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-red">Pinned</span>}
                </p>
                {a.body && <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-muted">{a.body}</p>}
              </div>
              <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// H. Manan Vasa's ecosystem — honest PS links (no fake Tribe-native features) --
export async function EcosystemShortcuts() {
  const settings = await getPublicSettings();
  const ps = settings.ps_app_url || PS_APP_URL;
  const items = [
    { label: "Productivity Shastra", href: ps, external: true },
    { label: "Tribe Learning", href: ps, external: true },
    { label: "Karma Bank", href: ps, external: true },
    { label: "Gratitude Space", href: ps, external: true },
    { label: "Refer to Someone", href: "/refer", external: false },
  ];
  return (
    <section>
      <SectionHead title="Manan Vasa's Ecosystem" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => {
          const cls = "group flex items-center gap-2.5 rounded-xl border border-hairline bg-surface px-3.5 py-3 text-[13px] font-medium text-ink transition-colors hover:border-hairline-bright";
          const body = (
            <>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-sunk text-ink-muted">{IconGrid}</span>
              <span className="min-w-0 flex-1 truncate">{it.label}</span>
              <span className="shrink-0 text-ink-muted transition-colors group-hover:text-red" aria-hidden>{it.external ? "↗" : "→"}</span>
            </>
          );
          return it.external ? (
            <a key={it.label} href={it.href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
          ) : (
            <Link key={it.label} href={it.href} className={cls}>{body}</Link>
          );
        })}
      </div>
      <p className="mt-2 t-caption">Tribe Learning, Karma Bank &amp; Gratitude Space open in the Productivity Shastra app.</p>
    </section>
  );
}

// G/I. Deferred surfaces — real backend/content doesn't exist yet, so these
// render NOTHING (no fake data). The components are ready to switch on when
// elevator-pitch video data / published Inspiration content lands.
export async function ElevatorPitches() {
  // No elevator-pitch storage yet → hidden until real data exists.
  return null;
}
export async function InspirationHighlights() {
  // No public Inspiration/Wins publication model yet → hidden until real data exists.
  return null;
}
