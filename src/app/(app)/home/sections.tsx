import Link from "next/link";
import { getMyProfileSummary, getSuggestedMembers } from "@/lib/dashboard";
import { getUpcomingEvents } from "@/lib/events";
import { getAnnouncements } from "@/lib/community";
import { initials } from "./widgets/_shared";

// ── UI-3 Home Sections (Refactored to match approved design reference) ─────────

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

// ── 1. IDENTITY HERO CARD ──────────────────────────────────────────────────
export async function IdentityHero() {
  const me = await getMyProfileSummary();
  const first = (me.fullName || me.displayName || "Yashita").split(" ")[0];
  const fullName = me.fullName || "Yashita Mouli";
  const businessName = me.businessName || "Mouli Industries Pvt. Ltd.";
  const meta = [me.category || "Manufacturing", me.natureOfBusiness || me.industry || "Industrial Equipments"].filter(Boolean).join("  •  ");
  const usp = me.usp || "Delivering high-performance industrial equipment with precision, reliability and long-term partnership.";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[24px] font-bold text-ink sm:text-[28px] tracking-tight flex items-center gap-2">
          Welcome back, {first}! 👋
        </h1>
        <p className="mt-0.5 text-[14px] text-ink-secondary">Let&apos;s build meaningful connections today.</p>
      </div>

      <section className="eco-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
          <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-full border-2 border-hairline bg-surface-sunk sm:h-20 sm:w-20">
            {me.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.photoUrl} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-sans text-lg font-bold text-ink-muted">
                {initials(fullName) || "YM"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] font-bold text-ink sm:text-[20px]">{fullName}</h2>
              <span className="rounded-full bg-red/10 px-2.5 py-0.5 text-[11px] font-bold text-red uppercase tracking-wider">
                MEMBER
              </span>
            </div>
            <p className="mt-0.5 text-[14px] font-semibold text-ink-secondary">{businessName}</p>
            <p className="mt-1 text-[12px] text-ink-muted">{meta}</p>
          </div>
        </div>

        {/* USP block */}
        <div className="mt-4 rounded-xl border border-hairline bg-surface-sunk/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">MY USP</p>
          <p className="mt-1 text-[14px] leading-relaxed text-ink font-medium">“{usp}”</p>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href={me.slug ? `/m/${me.slug}` : "/account"} className={linkSecondary}>
            View My Profile
          </Link>
          <Link href="/notifications" className={linkPrimary + " relative"}>
            Notifications
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-red">
              9+
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── 2. ANNOUNCEMENTS CARD ──────────────────────────────────────────────────
export async function HomeAnnouncements() {
  const items = await getAnnouncements();
  const top = items[0] || {
    id: "conclave-2026",
    title: "Altus Tribe Conclave 2026 – Registrations Open!",
    body: "Join us for a power-packed day of learning, networking and growth.",
    publishedAt: "2026-07-22T00:00:00Z",
    pinnedAt: "2026-07-22T00:00:00Z",
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "Jul 22, 2026" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <section className="eco-card flex flex-col justify-between p-5 sm:p-6">
      <div>
        <SectionHead title="Announcements from Manan Vasa" href="/sacred-space" />
        
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <span className="inline-block rounded-md bg-red/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-red">
              PINNED
            </span>
            <h3 className="text-[16px] font-bold text-ink leading-snug">{top.title}</h3>
            <p className="text-[13px] leading-relaxed text-ink-secondary">{top.body}</p>
            <p className="text-[11px] text-ink-muted">{fmtDate(top.publishedAt || "")}</p>
          </div>

          <div className="h-28 w-full sm:w-32 shrink-0 overflow-hidden rounded-xl border border-hairline bg-surface-sunk">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80"
              alt="Conclave 2026"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Carousel dots */}
      <div className="mt-6 flex items-center justify-center gap-1.5 pt-2">
        <span className="h-2 w-5 rounded-full bg-red" />
        <span className="h-2 w-2 rounded-full bg-hairline-bright" />
        <span className="h-2 w-2 rounded-full bg-hairline-bright" />
        <span className="h-2 w-2 rounded-full bg-hairline-bright" />
        <span className="h-2 w-2 rounded-full bg-hairline-bright" />
      </div>
    </section>
  );
}

// ── 3. NETWORKING ACTIONS ("What would you like to do?") ────────────────────
export function NetworkingActions() {
  const actions = [
    {
      title: "Connect with Participants",
      sub: "Discover participants by business, category and expertise.",
      href: "/explore",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: "Tribe",
      sub: "Join conversations, groups and networking activity.",
      href: "/explore?tab=groups",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
    {
      title: "Sacred Space",
      sub: "Connect privately with Manan Vasa / Team and view important communication.",
      href: "/sacred-space",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      title: "Referral Rounds",
      sub: "Build consistent referral relationships inside the Tribe.",
      href: "/refer",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      ),
    },
    {
      title: "Campus",
      sub: "Explore videos, learning and the PS ecosystem.",
      href: "/campus",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-[17px] font-bold text-ink sm:text-[19px] tracking-tight">
        What would you like to do?
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((act) => (
          <Link
            key={act.title}
            href={act.href}
            className="group eco-card relative flex flex-col justify-between p-4 transition-all hover:border-hairline-bright hover:shadow-md"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red text-white shadow-sm shadow-red/20">
                {act.icon}
              </div>
              <h3 className="mt-3 text-[14px] font-bold text-ink group-hover:text-red transition-colors">
                {act.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-muted">
                {act.sub}
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-[13px] text-ink-muted group-hover:translate-x-1 transition-transform group-hover:text-red">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── 4. CONCLAVE CARD ───────────────────────────────────────────────────────
export async function ConclaveCard() {
  const events = await getUpcomingEvents(1);
  const ev = events[0] || {
    title: "Altus Conclave 2026",
    startsAt: "2026-08-23T09:00:00Z",
    location: "Mumbai, India",
    description: "A day of inspiration, learning and unparalleled networking with India's top entrepreneurs.",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
  };

  return (
    <section className="eco-card flex flex-col justify-between p-5 sm:p-6">
      <div>
        <SectionHead title="Next Altus Conclave" href="/campus" />

        <div className="mt-2 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="text-[17px] font-bold text-ink">{ev.title}</h3>
            <p className="text-[13px] font-medium text-red">Sat, Aug 23, 2026</p>
            <p className="flex items-center gap-1 text-[12px] text-ink-muted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {ev.location || "Mumbai, India"}
            </p>
            <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink-secondary">
              {ev.description}
            </p>
          </div>

          <div className="grid h-28 w-full shrink-0 place-items-center rounded-xl border border-hairline bg-surface-sunk text-red sm:w-32" aria-hidden>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-1">
        <Link href="/campus" className={linkSecondary + " w-full"}>
          View Event Details
        </Link>
      </div>
    </section>
  );
}

// ── 5. TODAY'S NETWORK CARD ────────────────────────────────────────────────
export async function TodaysNetwork() {
  const people = await getSuggestedMembers(4);
  const sampleFallback = [
    { name: "Rohit Sharma", company: "Sharma Tech", category: "IT Solutions", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80" },
    { name: "Neha Verma", company: "Verma Realty", category: "Real Estate", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80" },
    { name: "Arjun Mehta", company: "Mehta & Co.", category: "Finance", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80" },
    { name: "Pooja Nair", company: "Nair Designs", category: "Interiors", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80" },
  ];

  const displayList = people.length >= 4 ? people.map(p => ({
    name: p.fullName,
    company: p.businessName || "Business Member",
    category: p.category || "Professional",
    photo: p.photoUrl,
    slug: p.slug
  })) : sampleFallback;

  return (
    <section className="eco-card flex flex-col justify-between p-5 sm:p-6">
      <div>
        <SectionHead title="Today's Network" href="/explore" />

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {displayList.map((m, idx) => (
            <div key={idx} className="flex flex-col items-center rounded-xl border border-hairline bg-surface-sunk/40 p-3 text-center transition-all hover:bg-surface-sunk">
              <div className="h-14 w-14 overflow-hidden rounded-full border border-hairline bg-white shadow-xs">
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-[13px] text-ink-muted">
                    {initials(m.name)}
                  </div>
                )}
              </div>
              <p className="mt-2 text-[13px] font-bold text-ink truncate w-full">{m.name}</p>
              <p className="text-[11px] font-medium text-ink-secondary truncate w-full">{m.company}</p>
              <p className="text-[10px] text-ink-muted truncate w-full">{m.category}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-center">
        <span className="text-[14px]">👥</span>
        <span className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">12 new connections this week</span>
      </div>
    </section>
  );
}

// ── 6. RECENT ACTIVITY CARD ────────────────────────────────────────────────
export function RecentActivity() {
  const activities = [
    {
      icon: (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
        </span>
      ),
      text: "New message from Rohit Sharma",
      time: "2 min ago",
      unread: true,
    },
    {
      icon: (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
        </span>
      ),
      text: "Neha Verma joined your group",
      time: "18 min ago",
      unread: true,
    },
    {
      icon: (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red/10 text-red">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /></svg>
        </span>
      ),
      text: "New announcement: Conclave 2026",
      time: "1 hr ago",
      unread: false,
    },
  ];

  return (
    <section className="eco-card flex flex-col justify-between p-5 sm:p-6">
      <div>
        <SectionHead title="Recent Activity" href="/notifications" />

        <div className="mt-3 divide-y divide-hairline">
          {activities.map((act, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3 min-w-0">
                {act.icon}
                <p className="text-[13px] font-semibold text-ink truncate">{act.text}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-ink-muted">{act.time}</span>
                {act.unread && <span className="h-2 w-2 rounded-full bg-red" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 7. INSPIRATION CORNER ──────────────────────────────────────────────────
export function InspirationCorner() {
  return (
    <section className="eco-card flex flex-col justify-between p-5 sm:p-6">
      <div>
        <SectionHead title="Inspiration Corner" href="/campus" />

        <div className="mt-4 flex flex-col justify-center rounded-2xl border border-hairline bg-surface-sunk/50 p-5 text-center min-h-[120px]">
          <p className="text-[15px] font-medium italic leading-relaxed text-ink">
            “The best way to predict the future is to create it.”
          </p>
          <p className="mt-2 text-[12px] font-bold text-ink-muted uppercase tracking-wider">
            — Peter Drucker
          </p>
        </div>
      </div>
    </section>
  );
}

// ── 8. ELEVATOR PITCHES CARD ───────────────────────────────────────────────
export function ElevatorPitches() {
  const pitches = [
    {
      name: "Rohit Sharma",
      company: "Sharma Tech",
      duration: "2:15",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
    },
    {
      name: "Neha Verma",
      company: "Verma Realty",
      duration: "1:48",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80",
    },
    {
      name: "Arjun Mehta",
      company: "Mehta & Co.",
      duration: "2:05",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    },
  ];

  return (
    <section className="eco-card flex flex-col justify-between p-5 sm:p-6">
      <div>
        <SectionHead title="Elevator Pitches" href="/explore" />

        <div className="mt-3 grid grid-cols-3 gap-3">
          {pitches.map((p, idx) => (
            <div key={idx} className="group relative flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-hairline bg-surface-sunk">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity group-hover:bg-black/40">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </div>
                </div>
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                  {p.duration}
                </span>
              </div>
              <p className="mt-2 text-[12px] font-bold text-ink truncate">{p.name}</p>
              <p className="text-[10px] text-ink-muted truncate">{p.company}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Retain legacy exports for backwards compatibility
export async function EcosystemShortcuts() {
  return null;
}
export async function InspirationHighlights() {
  return null;
}
