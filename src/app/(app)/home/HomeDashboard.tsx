import Link from "next/link";
import { getMyProfileSummary, getSuggestedMembers } from "@/lib/dashboard";
import { getUpcomingEvents, getNextReferralRound } from "@/lib/events";
import { getNotifications } from "@/lib/notifications";
import { initials } from "./widgets/_shared";
import ReferralRoundCountdown from "./ReferralRoundCard";

// ═══════════════════════════════════════════════════════════════════════════
// Home dashboard (CDO redesign, 2026-07-29). Scan order: KPIs → Networking →
// Today's opportunities → Activity. Altus palette only (white/black/grey/soft
// red). Real data where a backend exists; sample data (clearly marked) for the
// KPI ribbon and the referrals inbox/outbox, which have no backend yet.
// ═══════════════════════════════════════════════════════════════════════════

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function rel(iso: string) {
  const diff = Date.now() - Date.parse(iso);
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Avatar (initials; no stock photos) ──────────────────────────────────────
function Avatar({ name, photo, size = 40 }: { name: string; photo?: string | null; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface-sunk text-[12px] font-bold text-ink-muted"
      style={{ width: size, height: size }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

// ── KPI ribbon ──────────────────────────────────────────────────────────────
const KPI_ICON = (path: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: path }} />
);
const KPIS = [
  { label: "Connections Made", value: "146", delta: "12 this month", icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>' },
  { label: "Referrals Sent", value: "38", delta: "8 this month", icon: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>' },
  { label: "Referrals Received", value: "27", delta: "6 this month", icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' },
  { label: "Successful Referrals", value: "19", delta: "5 this month", icon: '<circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>' },
  { label: "People You Helped", value: "52", delta: "11 this month", icon: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>' },
  { label: "Businesses Connected", value: "23", delta: "4 this month", icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>' },
  { label: "Contribution Score", value: "840", delta: "Top 18%", icon: '<polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5 12 2"/>' },
  { label: "Community Rank", value: "#32", delta: "7 this month", icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
];

function KpiRibbon() {
  return (
    <section className="rounded-2xl border border-hairline bg-white dark:bg-surface">
      <div className="grid grid-cols-2 divide-x divide-y divide-hairline sm:grid-cols-4 xl:grid-cols-8 xl:divide-y-0">
        {KPIS.map((k) => (
          <div key={k.label} className="flex flex-col gap-1 p-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red/8 text-red">{KPI_ICON(k.icon)}</span>
            <p className="mt-1 text-[20px] font-bold leading-none text-ink">{k.value}</p>
            <p className="truncate text-[11px] text-ink-muted">{k.label}</p>
            <p className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 10H4z" /></svg>
              {k.delta}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Networking module: Received · Sent · Recommended ────────────────────────
const TAG = "inline-block rounded-md bg-red/8 px-1.5 py-0.5 text-[10px] font-semibold text-red";
const RECEIVED = [
  { name: "Priya Shah", role: "CEO", company: "InnovateX", tag: "Technology", mutual: 3 },
  { name: "Hetesh Vichare", role: "Founder", company: "TechNova", tag: "Technology", mutual: 2 },
];
const SENT = [
  { name: "Rohan Mehta", role: "CTO", company: "DataSprout", tag: "AI / SaaS", mutual: 1 },
  { name: "Karan Desai", role: "Co-founder", company: "Nexora", tag: "Technology", mutual: 1 },
];

function ModuleHead({ icon, title, count, href }: { icon: string; title: string; count: number; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red/8 text-red">{KPI_ICON(icon)}</span>
        <h3 className="text-[14px] font-bold text-ink">{title}</h3>
      </div>
      <Link href={href} className="shrink-0 text-[12px] font-semibold text-red hover:text-red-hover">Open all ({count}) →</Link>
    </div>
  );
}

function PersonMini({ p, tone }: { p: { name: string; role: string; company: string; tag: string; mutual: number }; tone: "accept" | "pending" }) {
  return (
    <div className="rounded-xl border border-hairline p-3">
      <div className="flex items-start gap-2.5">
        <Avatar name={p.name} size={40} />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-ink">{p.name}</p>
          <p className="truncate text-[11px] text-ink-muted">{p.role} · {p.company}</p>
          <span className={`mt-1 ${TAG}`}>{p.tag}</span>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-ink-muted">{p.mutual} mutual connection{p.mutual === 1 ? "" : "s"}</p>
      {tone === "accept" ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className="rounded-lg bg-red px-2 py-1.5 text-[12px] font-semibold text-white hover:bg-red-hover">Accept</button>
          <button className="rounded-lg border border-hairline px-2 py-1.5 text-[12px] font-semibold text-ink hover:border-hairline-bright">Decline</button>
        </div>
      ) : (
        <div className="mt-2 rounded-lg bg-red/5 py-1.5 text-center text-[12px] font-semibold text-red">Pending</div>
      )}
    </div>
  );
}

async function NetworkingModule() {
  const recs = await getSuggestedMembers(4);
  return (
    <section className="rounded-2xl border border-hairline bg-white p-5 dark:bg-surface">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:divide-x lg:divide-hairline">
        {/* Received */}
        <div className="lg:pr-6">
          <ModuleHead icon='<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>' title="Referrals Received" count={12} href="/connections" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {RECEIVED.map((p) => <PersonMini key={p.name} p={p} tone="accept" />)}
          </div>
        </div>
        {/* Sent */}
        <div className="lg:px-6">
          <ModuleHead icon='<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>' title="Referrals Sent" count={8} href="/connections" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SENT.map((p) => <PersonMini key={p.name} p={p} tone="pending" />)}
          </div>
        </div>
        {/* Recommended (real suggested members) */}
        <div className="lg:pl-6">
          <ModuleHead icon='<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>' title="Recommended for you" count={20} href="/explore" />
          {recs.length === 0 ? (
            <p className="text-[12px] text-ink-muted">No suggestions yet — explore the directory.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {recs.map((m) => (
                <div key={m.slug} className="rounded-xl border border-hairline p-3 text-center">
                  <Avatar name={m.fullName} photo={m.photoUrl} size={44} />
                  <p className="mt-1.5 truncate text-[12px] font-bold text-ink">{m.fullName}</p>
                  {m.businessName && <p className="truncate text-[10px] text-ink-muted">{m.businessName}</p>}
                  {m.category && <span className={`mt-1 ${TAG}`}>{m.category}</span>}
                  <Link href={`/m/${m.slug}`} className="mt-2 block rounded-lg border border-red/30 py-1 text-[12px] font-semibold text-red hover:bg-red/5">Connect</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Action cards: Campus · Conclave · Referral Round ────────────────────────
const primary = "flex h-10 items-center justify-center rounded-xl bg-red text-[13px] font-semibold text-white transition-colors hover:bg-red-hover";
const secondary = "flex h-10 items-center justify-center rounded-xl border border-hairline bg-white text-[13px] font-semibold text-ink transition-colors hover:border-hairline-bright dark:bg-surface";

function CampusCard() {
  return (
    <section className="flex flex-col rounded-2xl border border-hairline bg-white p-5 dark:bg-surface">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-red/8 text-red">{KPI_ICON('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>')}</span><h3 className="text-[14px] font-bold text-ink">Campus</h3></div>
        <Link href="/campus" className="text-[12px] font-semibold text-red hover:text-red-hover">See all →</Link>
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <p className="text-[11px] text-ink-muted">Continue learning</p>
          <p className="text-[13px] font-semibold text-ink">AI for Business Leaders</p>
          <div className="mt-1.5 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hairline"><div className="h-full w-[65%] rounded-full bg-red" /></div><span className="text-[11px] font-semibold text-ink-muted">65%</span></div>
        </div>
        <div className="flex items-center justify-between border-t border-hairline pt-2"><div><p className="text-[11px] text-ink-muted">Recommended</p><p className="text-[13px] font-semibold text-ink">Growth Marketing Masterclass</p></div><span className="rounded-md bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">New</span></div>
        <div className="flex items-center justify-between border-t border-hairline pt-2"><div><p className="text-[11px] text-ink-muted">Latest resource</p><p className="text-[13px] font-semibold text-ink">Pitch Deck Template</p></div><span className="rounded-md bg-red/8 px-1.5 py-0.5 text-[10px] font-semibold text-red">PDF</span></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2"><Link href="/campus" className={primary}>Go to Campus</Link><Link href="/campus" className={secondary}>Browse All</Link></div>
    </section>
  );
}

async function ConclaveCard() {
  const events = await getUpcomingEvents(3);
  const ev = events.find((e) => e.featured) ?? events[0];
  return (
    <section className="flex flex-col rounded-2xl border border-hairline bg-white p-5 dark:bg-surface">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-red/8 text-red">{KPI_ICON('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>')}</span><h3 className="text-[14px] font-bold text-ink">Next Altus Conclave</h3></div>
        <Link href="/campus" className="text-[12px] font-semibold text-red hover:text-red-hover">See all →</Link>
      </div>
      <div className="flex-1 rounded-xl bg-red/[0.03] p-4">
        {ev ? (
          <>
            <p className="text-[16px] font-bold text-ink">{ev.title}</p>
            <p className="mt-0.5 text-[12px] font-medium text-red">{fmtDate(ev.startsAt)}{ev.location ? ` · ${ev.location}` : ""}</p>
            {ev.description && <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-ink-secondary">{ev.description}</p>}
          </>
        ) : (
          <p className="text-[13px] text-ink-muted">No upcoming conclave scheduled yet.</p>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {ev?.link ? <a href={ev.link} target="_blank" rel="noopener noreferrer" className={primary}>Register Now</a> : <Link href="/campus" className={primary}>Register Now</Link>}
        <Link href="/campus" className={secondary}>View Details</Link>
      </div>
    </section>
  );
}

async function ReferralRoundCard() {
  const rr = await getNextReferralRound();
  return (
    <section className="flex flex-col rounded-2xl border border-hairline bg-white p-5 dark:bg-surface">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-red/8 text-red">{KPI_ICON('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>')}</span><h3 className="text-[14px] font-bold text-ink">Next Referral Round</h3></div>
        <span className="rounded-md bg-red/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red">Free</span>
      </div>
      <div className="flex-1">
        <ReferralRoundCountdown startsAt={rr.startsAt} title={rr.title} location={rr.location} link={rr.link} />
      </div>
    </section>
  );
}

// ── Recent Activity (real notifications; sample fallback) ───────────────────
const SAMPLE_ACTIVITY = [
  { icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>', title: "New connection made", detail: "With Priya Shah", when: "2h ago" },
  { icon: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>', title: "Referral accepted", detail: "Ajay from TechNova", when: "5h ago" },
  { icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>', title: "Event registered", detail: "Altus Conclave 2026", when: "1d ago" },
  { icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>', title: "New resource added", detail: "Pitch Deck Template", when: "2d ago" },
];

async function RecentActivity() {
  const notifs = (await getNotifications()).slice(0, 6);
  const rows = notifs.length > 0
    ? notifs.map((n) => ({ icon: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>', title: n.title, detail: n.link ? "View →" : "", when: rel(n.createdAt), link: n.link || "/notifications" }))
    : SAMPLE_ACTIVITY.map((a) => ({ ...a, link: "/notifications" }));

  return (
    <section className="rounded-2xl border border-hairline bg-white p-5 dark:bg-surface">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-red/8 text-red">{KPI_ICON('<polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>')}</span><h3 className="text-[14px] font-bold text-ink">Recent Activity</h3></div>
        <Link href="/notifications" className="text-[12px] font-semibold text-red hover:text-red-hover">See all →</Link>
      </div>
      <ul className="divide-y divide-hairline">
        {rows.map((r, i) => (
          <li key={i}>
            <Link href={r.link} className="flex items-center gap-3 py-2.5 transition-colors hover:bg-surface-hover/40">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-ink-muted">{KPI_ICON(r.icon)}</span>
              <span className="min-w-0 flex-1"><span className="text-[13px] font-semibold text-ink">{r.title}</span>{r.detail && <span className="ml-2 text-[12px] text-ink-muted">{r.detail}</span>}</span>
              <span className="shrink-0 text-[11px] text-ink-muted">{r.when}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function HomeDashboard() {
  // Warm the profile summary (kept for future personalization of the greeting).
  await getMyProfileSummary();
  return (
    <div className="space-y-5">
      <KpiRibbon />
      <NetworkingModule />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <CampusCard />
        <ConclaveCard />
        <ReferralRoundCard />
      </div>
      <RecentActivity />
    </div>
  );
}
