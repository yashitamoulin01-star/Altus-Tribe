import Link from "next/link";
import { getMyProfileSummary, getSuggestedMembers, type MyProfileSummary } from "@/lib/dashboard";
import { getUpcomingEvents, getNextReferralRound } from "@/lib/events";
import { getNotifications } from "@/lib/notifications";
import { getAnnouncements } from "@/lib/community";
import { initials } from "./widgets/_shared";
import ReferralRoundMini from "./ReferralRoundMini";
import TribeLiveTicker, { type TickerItem } from "./TribeLiveTicker";
import Reveal from "@/components/Reveal";

// ═══════════════════════════════════════════════════════════════════════════
// Home dashboard — matches the owner's reference spec (2026-07-29). Scan order:
// KPIs → Networking (Received · Sent · Recommended) → Campus/Conclave/Referral →
// Recent Activity. Real data where a backend exists; sample data for KPIs and
// the referrals inbox/outbox (no backend yet). Designed for a 14" laptop.
// ═══════════════════════════════════════════════════════════════════════════

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function rel(iso: string) {
  const h = Math.floor((Date.now() - Date.parse(iso)) / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function daysUntil(iso: string) {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));
}
function icon(path: string, size = 14) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: path }} />;
}
// Category → chip colour (purple / green / blue, per reference — exact hex so it
// renders regardless of the Tailwind theme palette).
function chipClass(tag: string) {
  const t = tag.toLowerCase();
  if (/ai|saas|data|cloud|software/.test(t)) return "bg-[#DCFCE7] text-[#15803D]";
  if (/product|design|retail|consumer/.test(t)) return "bg-[#E0F2FE] text-[#0369A1]";
  return "bg-[#F3E8FF] text-[#7E22CE]";
}

function Avatar({ name, photo, size = 44 }: { name: string; photo?: string | null; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface-sunk text-[12px] font-bold text-ink-muted" style={{ width: size, height: size }}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={name} className="h-full w-full object-cover" />
      ) : initials(name)}
    </span>
  );
}
// Stacked mini avatars (mutual connections) — grey placeholders + "+N".
function MutualStack({ n }: { n: number }) {
  const show = Math.min(n, 3);
  return (
    <div className="flex items-center justify-center">
      {Array.from({ length: show }).map((_, i) => (
        <span key={i} className="h-[18px] w-[18px] rounded-full border-2 border-white bg-surface-sunk" style={{ marginLeft: i ? -5 : 0 }} />
      ))}
      {n > show && <span className="ml-1 text-[8px] text-ink-muted">+{n - show}</span>}
    </div>
  );
}

// ── Analytics ribbon (one continuous panel, pastel per-metric icons) ─────────
// Reference: premium enterprise KPI ribbon (Stripe / Linear / HubSpot). Each
// metric gets its own soft pastel icon chip (exact hex so it renders regardless
// of the Tailwind theme). Number dominates; label muted; trend green.
const KPIS = [
  { label: "Connections Made", value: "146", delta: "12 this month", bg: "#FEE2E2", fg: "#DC2626", i: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>' },
  { label: "Referrals Sent", value: "38", delta: "8 this month", bg: "#EDE9FE", fg: "#7C3AED", i: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>' },
  { label: "Referrals Received", value: "27", delta: "6 this month", bg: "#DCFCE7", fg: "#16A34A", i: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' },
  { label: "Successful Referrals", value: "19", delta: "5 this month", bg: "#FFEDD5", fg: "#EA580C", i: '<circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>' },
  { label: "People You Helped", value: "52", delta: "11 this month", bg: "#DBEAFE", fg: "#2563EB", i: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>' },
  { label: "Businesses Connected", value: "23", delta: "4 this month", bg: "#F3E8FF", fg: "#9333EA", i: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>' },
  { label: "Contribution Score", value: "840", delta: "Top 18%", bg: "#FCE7F3", fg: "#DB2777", i: '<polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5 12 2"/>' },
  { label: "Community Rank", value: "#32", delta: "7 this month", bg: "#E0F2FE", fg: "#0284C7", i: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
];
function KpiRibbon() {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04),0_20px_40px_rgba(225,33,45,0.03)] dark:bg-surface dark:shadow-none">
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="group flex flex-col px-3.5 py-3.5 transition-colors hover:bg-surface-sunk/40 xl:border-l xl:border-hairline/70 xl:first:border-l-0"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full shadow-inner transition-transform group-hover:scale-105"
              style={{ backgroundColor: k.bg, color: k.fg }}
            >
              {icon(k.i, 17)}
            </span>
            <p className="mt-2.5 text-[21px] font-bold leading-none text-ink">{k.value}</p>
            <p className="mt-1.5 text-[10px] font-medium leading-tight text-ink-muted">{k.label}</p>
            <p className="mt-1.5 flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 10H4z" /></svg>{k.delta}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Networking cards ────────────────────────────────────────────────────────
function CardHead({ i, title, count, href }: { i: string; title: string; count: number; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2 border-b border-hairline pb-2.5">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red/10 text-red">{icon(i, 13)}</span>
        <h3 className="text-[13px] font-bold text-ink">{title}</h3>
      </div>
      <Link href={href} className="shrink-0 text-[11px] font-semibold text-red hover:text-red-hover">Open all ({count}) →</Link>
    </div>
  );
}
type Person = { name: string; role: string; company: string; tag: string; mutual: number; photo?: string | null; slug?: string };
function PersonCard({ p, action }: { p: Person; action: "accept" | "pending" | "connect" }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-xl border border-hairline bg-surface-sunk/40 p-3 text-center">
      <Avatar name={p.name} photo={p.photo} size={44} />
      <p className="mt-1.5 text-[12px] font-semibold leading-tight text-ink">{p.name}</p>
      <p className="text-[10px] leading-tight text-ink-muted">{p.role}{p.company ? ` · ${p.company}` : ""}</p>
      <span className={`mt-1.5 whitespace-nowrap rounded px-2 py-0.5 text-[9px] font-semibold ${chipClass(p.tag)}`}>{p.tag}</span>
      {p.mutual > 0 && (
        <>
          <p className="mt-1.5 text-[9px] text-ink-muted">{p.mutual} Mutual Connection{p.mutual === 1 ? "" : "s"}</p>
          <div className="mt-1.5 mb-2"><MutualStack n={p.mutual} /></div>
        </>
      )}
      <div className="mt-auto flex w-full gap-1.5">
        {action === "accept" && <>
          <button className="flex-1 rounded-md bg-red py-1.5 text-[11px] font-semibold text-white hover:bg-red-hover">Accept</button>
          <button className="flex-1 rounded-md border border-hairline bg-white py-1.5 text-[11px] font-semibold text-ink hover:border-hairline-bright dark:bg-surface">Decline</button>
        </>}
        {action === "pending" && <span className="flex-1 rounded-md bg-red/8 py-1.5 text-center text-[11px] font-semibold text-red">Pending</span>}
        {action === "connect" && (p.slug
          ? <Link href={`/m/${p.slug}`} className="flex-1 rounded-md border border-red/30 py-1.5 text-center text-[11px] font-semibold text-red hover:bg-red/5">Connect</Link>
          : <button className="flex-1 rounded-md border border-red/30 py-1.5 text-[11px] font-semibold text-red hover:bg-red/5">Connect</button>)}
      </div>
    </div>
  );
}

const CARD = "min-w-0 rounded-2xl border border-hairline bg-gradient-to-br from-white to-red/[0.02] p-4 shadow-sm transition-all hover:shadow-md hover:border-red/20 dark:from-surface dark:to-surface";

// ── Contextual "Networking Insights" panel ──────────────────────────────────
// Fills leftover column space so a thin/new community never shows empty
// whitespace and never stretches or fakes profile cards. Same visual language
// as the cards (rounded, subtle red gradient, small icon).
type Insight = { ic: string; kicker: string; title: string; body: string; cta?: { label: string; href: string }; by?: string };
function InsightPanel({ ins }: { ins: Insight }) {
  return (
    <div className="flex flex-col rounded-xl border border-dashed border-red/20 bg-gradient-to-br from-red/[0.035] to-transparent p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red/10 text-red">{icon(ins.ic, 15)}</span>
      <p className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-red/80">{ins.kicker}</p>
      <p className="mt-0.5 text-[12.5px] font-bold leading-snug text-ink">{ins.title}</p>
      <p className="mt-1 flex-1 text-[11px] leading-relaxed text-ink-muted">{ins.body}</p>
      {ins.by && <p className="mt-1.5 text-[10px] font-semibold text-ink-secondary">— {ins.by}</p>}
      {ins.cta && <Link href={ins.cta.href} className={`${primary} mt-3 w-full`}>{ins.cta.label}</Link>}
    </div>
  );
}

const IC_USER = '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>';
const IC_RECV = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>';
const IC_SENT = '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>';
const IC_REC = '<path d="M14 9V5a3 3 0 0 0-6 0v4"/><rect x="2" y="9" width="20" height="12" rx="2"/>';
const IC_BULB = '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/>';
const IC_STAR = '<polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5 12 2"/>';
const IC_TARGET = '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>';
const IC_BRIEF = '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>';

// Rotate by the hour so the homepage feels fresh on return, without any client JS.
const rotate = <T,>(arr: T[]) => arr[Math.floor(Date.now() / 3_600_000) % arr.length];

// Referrals-Received filler (educational when empty, tips otherwise).
function receivedInsight(count: number): Insight {
  if (count === 0)
    return { ic: IC_RECV, kicker: "How it works", title: "How referrals reach you", body: "When a member believes you're the right fit, they introduce you here. A complete profile with a clear USP makes you far easier to refer.", cta: { label: "View Referral Guide", href: "/referral-rounds" } };
  return rotate<Insight>([
    { ic: IC_BULB, kicker: "Referral etiquette", title: "Respond promptly", body: "Acknowledge every introduction quickly — even a short reply keeps the referrer's trust and momentum going." },
    { ic: IC_STAR, kicker: "Be referable", title: "Sharpen your USP", body: "A one-line value statement helps members refer you to exactly the right people." },
  ]);
}

// Referrals-Sent filler.
function sentInsight(count: number): Insight {
  if (count === 0)
    return { ic: IC_SENT, kicker: "Give first", title: "Start making referrals", body: "Help other members by introducing relevant businesses. Strong communities grow through meaningful introductions.", cta: { label: "Explore Members", href: "/explore" } };
  return rotate<Insight>([
    { ic: IC_TARGET, kicker: "Best practice", title: "Be specific", body: "Specific introductions create stronger relationships than generic networking. Say why the two should meet." },
    { ic: IC_BULB, kicker: "Community", title: "Help others first", body: "The strongest communities are built by members who give before they ask." },
  ]);
}

// Recommended filler — the "Tribe Coach" priority engine (Decision 3).
function tribeCoach(me: MyProfileSummary): Insight {
  if (me.completion < 70)
    return { ic: IC_USER, kicker: "Get started", title: "Complete Your Profile", body: "Members with complete profiles receive better recommendations.", cta: { label: "Complete Profile", href: "/account/edit" } };
  if (!me.usp.trim())
    return { ic: IC_STAR, kicker: "Stand out", title: "Add Your USP", body: "Clearly explain your value so other members know exactly when to connect with you.", cta: { label: "Add USP", href: "/account/edit" } };
  if (!me.photoUrl)
    return { ic: IC_USER, kicker: "Build trust", title: "Upload a Professional Photo", body: "Professional photos improve trust and engagement across the Tribe.", cta: { label: "Upload Photo", href: "/account/edit" } };
  if (!me.industry.trim() || !me.businessName.trim())
    return { ic: IC_BRIEF, kicker: "Get matched", title: "Complete Business Information", body: "Industry and business details help us recommend the right connections for you.", cta: { label: "Update Details", href: "/account/edit" } };
  // Profile complete → rotate growth coaching (Decision 3, items 6–10).
  return rotate<Insight>([
    { ic: IC_STAR, kicker: "Founder tip", title: "People trust people before businesses", body: "Lead relationships with who you are — the business follows.", by: "Manan Vasa" },
    { ic: IC_TARGET, kicker: "Networking", title: "Be specific to be memorable", body: "Members who clearly define their ideal customer receive better introductions." },
    { ic: IC_BULB, kicker: "Weekly challenge", title: "Three small moves", body: "Meet one new member, help one business, and start one conversation this week." },
    { ic: IC_BRIEF, kicker: "Industry insight", title: `Grow in ${me.industry || "your field"}`, body: "Share a recent win or client success story to strengthen your credibility and visibility." },
  ]);
}

// Adaptive networking workspace (Decisions 1–6): three equal columns, always
// present. Each shows up to 4 cards; leftover space becomes a contextual
// Insights panel — never blank whitespace, never stretched or fabricated cards.
// When both referral columns are empty, Recommended expands 4 → 6 first.
async function Networking() {
  const me = await getMyProfileSummary();
  const received: Person[] = []; // ← wire real referrals-received here
  const sent: Person[] = []; //     ← wire real referrals-sent here
  const bothEmpty = received.length === 0 && sent.length === 0;
  const recs = await getSuggestedMembers(bothEmpty ? 6 : 4);
  const recCards = recs.slice(0, bothEmpty ? 6 : 4);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* Referrals Received */}
      <section style={{ flex: 1 }} className={CARD}>
        <CardHead i={IC_RECV} title="Referrals Received" count={received.length} href="/connections" />
        <div className="flex flex-col gap-3">
          {received.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {received.slice(0, 4).map((p) => <PersonCard key={p.name} p={p} action="accept" />)}
            </div>
          )}
          {received.length < 4 && <InsightPanel ins={receivedInsight(received.length)} />}
        </div>
      </section>

      {/* Referrals Sent */}
      <section style={{ flex: 1 }} className={CARD}>
        <CardHead i={IC_SENT} title="Referrals Sent" count={sent.length} href="/connections" />
        <div className="flex flex-col gap-3">
          {sent.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {sent.slice(0, 4).map((p) => <PersonCard key={p.name} p={p} action="pending" />)}
            </div>
          )}
          {sent.length < 4 && <InsightPanel ins={sentInsight(sent.length)} />}
        </div>
      </section>

      {/* Recommended For You */}
      <section style={{ flex: 1 }} className={CARD}>
        <CardHead i={IC_REC} title="Recommended for you" count={recs.length} href="/explore" />
        <div className="flex flex-col gap-3">
          {recCards.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {recCards.map((m) => (
                <PersonCard key={m.slug} action="connect" p={{ name: m.fullName, role: m.category || "Member", company: m.businessName || "", tag: m.industry || m.category || "Technology", mutual: 0, photo: m.photoUrl, slug: m.slug }} />
              ))}
            </div>
          )}
          {recCards.length === 0
            ? <InsightPanel ins={{ ic: IC_REC, kicker: "Recommendations", title: "Complete your profile", body: "We don't have enough information yet to recommend members. Complete your profile so we can recommend the right people.", cta: { label: "Complete Profile", href: "/account/edit" } }} />
            : recCards.length < 4 && <InsightPanel ins={tribeCoach(me)} />}
        </div>
      </section>
    </div>
  );
}

// ── Action cards ────────────────────────────────────────────────────────────
const primary = "flex h-9 items-center justify-center rounded-lg bg-red text-[12px] font-semibold text-white transition-colors hover:bg-red-hover";
const secondary = "flex h-9 items-center justify-center rounded-lg border border-hairline bg-white text-[12px] font-semibold text-ink transition-colors hover:border-hairline-bright dark:bg-surface";

function CampusCard() {
  return (
    <section className="flex flex-col rounded-2xl border border-hairline bg-gradient-to-br from-white to-red/[0.02] p-4 shadow-sm transition-all hover:shadow-md hover:border-red/20 dark:from-surface dark:to-surface">
      <div className="mb-3 flex items-center justify-between border-b border-hairline pb-2.5">
        <div className="flex items-center gap-1.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red/10 text-red">{icon('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>')}</span><h3 className="text-[13px] font-semibold text-ink">Campus</h3></div>
        <Link href="/campus" className="text-[11px] font-semibold text-red hover:text-red-hover">See all →</Link>
      </div>
      <div className="flex-1 space-y-2.5">
        <div>
          <div className="flex items-center justify-between"><p className="text-[10px] text-ink-muted">Continue Learning</p><span className="text-[10px] text-ink-muted">65%</span></div>
          <p className="text-[12px] font-semibold text-ink">AI for Business Leaders</p>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-hairline"><div className="h-full w-[65%] rounded-full bg-emerald-500" /></div>
        </div>
        <div className="flex items-center justify-between"><div><p className="text-[10px] text-ink-muted">Recommended for You</p><p className="text-[12px] font-semibold text-ink">Growth Marketing Masterclass</p></div><span className="rounded bg-[#E0F2FE] px-1.5 py-0.5 text-[9px] font-semibold text-[#0284C7]">New</span></div>
        <div className="flex items-center justify-between"><div><p className="text-[10px] text-ink-muted">Latest Resource</p><p className="text-[12px] font-semibold text-ink">Pitch Deck Template for Founders</p></div><span className="rounded bg-[#E0F2FE] px-1.5 py-0.5 text-[9px] font-semibold text-[#0284C7]">PDF</span></div>
      </div>
      <div className="mt-3 flex gap-2"><Link href="/campus" className={`${primary} flex-[2]`}>Go to Campus</Link><Link href="/campus" className={`${secondary} flex-1`}>Browse All</Link></div>
    </section>
  );
}

async function ConclaveCard() {
  const events = await getUpcomingEvents(3);
  const ev = events.find((e) => e.featured) ?? events[0];
  const title = ev?.title ?? "Winter Conclave 2026";
  const sub = ev ? `${fmtDate(ev.startsAt)}${ev.location ? ` · ${ev.location}` : ""}` : "Jan 15 – 17, 2026 · Mumbai";
  const daysLeft = ev ? daysUntil(ev.startsAt) : 15;
  return (
    <section className="flex flex-col rounded-2xl border border-hairline bg-gradient-to-br from-white to-red/[0.02] p-4 shadow-sm transition-all hover:shadow-md hover:border-red/20 dark:from-surface dark:to-surface">
      <div className="mb-3 flex items-center justify-between border-b border-hairline pb-2.5">
        <div className="flex items-center gap-1.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red/10 text-red">{icon('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>')}</span><h3 className="text-[13px] font-semibold text-ink">Next Altus Conclave</h3></div>
        <Link href="/campus" className="text-[11px] font-semibold text-red hover:text-red-hover">See all →</Link>
      </div>
      <div className="flex-1 rounded-xl bg-red/[0.04] p-4 text-center">
        <p className="text-[13px] font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-[10px] text-ink-muted">{sub}</p>
        <div className="mt-3 flex justify-around">
          <div><p className="text-[13px] font-bold text-ink">240</p><p className="text-[8px] text-ink-muted">Seats Left</p></div>
          <div><p className="text-[13px] font-bold text-ink">320+</p><p className="text-[8px] text-ink-muted">Members Going</p></div>
          <div><p className="text-[13px] font-bold text-ink">{daysLeft}</p><p className="text-[8px] text-ink-muted">Days Left</p></div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {ev?.link ? <a href={ev.link} target="_blank" rel="noopener noreferrer" className={`${primary} flex-[2]`}>Register Now</a> : <Link href="/campus" className={`${primary} flex-[2]`}>Register Now</Link>}
        <Link href="/campus" className={`${secondary} flex-1`}>View Details</Link>
      </div>
    </section>
  );
}

async function ReferralCard() {
  const rr = await getNextReferralRound();
  return (
    <section className="flex flex-col rounded-2xl border border-hairline bg-gradient-to-br from-white to-red/[0.02] p-4 shadow-sm transition-all hover:shadow-md hover:border-red/20 dark:from-surface dark:to-surface">
      <div className="mb-3 flex items-center justify-between border-b border-hairline pb-2.5">
        <div className="flex items-center gap-1.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red/10 text-red">{icon('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>')}</span><h3 className="text-[13px] font-semibold text-ink">Next Referral Round</h3></div>
        <div className="flex items-center gap-1.5"><span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700">Starting Soon</span><span className="rounded bg-surface-sunk px-1.5 py-0.5 text-[9px] font-semibold text-ink-muted">FREE</span></div>
      </div>
      <ReferralRoundMini startsAt={rr.startsAt} location={rr.location} link={rr.link} />
    </section>
  );
}

// ── Recent Activity (horizontal 5-up) ───────────────────────────────────────
const ACTIVITY = [
  { title: "New connection made", detail: "With Priya Shah", when: "2h ago", i: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>', tone: "bg-[#ECFDF5] text-[#10B981]" },
  { title: "Referral accepted", detail: "Ajay from TechNova", when: "5h ago", i: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>', tone: "bg-[#F3E8FF] text-[#9333EA]" },
  { title: "Event registered", detail: "Altus Conclave 2026", when: "1d ago", i: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>', tone: "bg-red/5 text-red" },
  { title: "New resource added", detail: "Pitch Deck Template", when: "2d ago", i: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>', tone: "bg-[#ECFDF5] text-[#10B981]" },
  { title: "Group joined", detail: "Founders Circle", when: "3d ago", i: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>', tone: "bg-[#E0F2FE] text-[#0284C7]" },
];
async function RecentActivity() {
  const notifs = (await getNotifications()).slice(0, 5);
  const rows = notifs.length >= 5
    ? notifs.map((n, i) => ({ title: n.title, detail: n.link ? "View →" : "", when: rel(n.createdAt), i: ACTIVITY[i % ACTIVITY.length].i, tone: ACTIVITY[i % ACTIVITY.length].tone, link: n.link || "/notifications" }))
    : ACTIVITY.map((a) => ({ ...a, link: "/notifications" }));
  return (
    <section className="rounded-2xl border border-hairline bg-gradient-to-br from-white to-red/[0.02] p-4 shadow-sm transition-all hover:shadow-md hover:border-red/20 dark:from-surface dark:to-surface">
      <div className="mb-3 flex items-center justify-between border-b border-hairline pb-2.5">
        <div className="flex items-center gap-1.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red/10 text-red">{icon('<polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>')}</span><h3 className="text-[13px] font-semibold text-ink">Recent Activity</h3></div>
        <Link href="/notifications" className="text-[11px] font-semibold text-red hover:text-red-hover">See all →</Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((r, i) => (
          <Link key={i} href={r.link} className="flex items-center gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${r.tone}`}>{icon(r.i, 13)}</span>
            <span className="min-w-0"><span className="block text-[11px] font-semibold leading-tight text-ink">{r.title}</span>{r.detail && <span className="block text-[10px] leading-tight text-ink-muted">{r.detail}</span>}<span className="block text-[9px] text-ink-muted/70">{r.when}</span></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Tribe Live ticker data (real announcements + live referral round) ────────
const TICK = {
  founder: { cat: "Founder Message", href: "/sacred-space", tone: "text-red", icon: '<polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5 12 2"/>' },
  event: { cat: "Event", href: "/campus", tone: "text-[#9333EA]", icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
  campus: { cat: "Campus", href: "/campus", tone: "text-[#0284C7]", icon: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>' },
  referral: { cat: "Referral", href: "/referral-rounds", tone: "text-[#EA580C]", icon: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>' },
  community: { cat: "Community", href: "/notifications", tone: "text-[#16A34A]", icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>' },
};
function classifyAnnouncement(title: string) {
  const t = title.toLowerCase();
  if (/manan|founder|sacred/.test(t)) return TICK.founder;
  if (/conclave|event|summit|register|seat/.test(t)) return TICK.event;
  if (/campus|course|resource|learn/.test(t)) return TICK.campus;
  if (/referral|refer/.test(t)) return TICK.referral;
  return TICK.community;
}
async function buildTickerItems(): Promise<TickerItem[]> {
  const [anns, rr] = await Promise.all([getAnnouncements(), getNextReferralRound()]);
  const items: TickerItem[] = [
    { id: "live-rr", category: TICK.referral.cat, text: `Next Referral Round — ${fmtDate(rr.startsAt)}`, href: TICK.referral.href, icon: TICK.referral.icon, tone: TICK.referral.tone },
  ];
  for (const a of anns.slice(0, 6)) {
    const c = classifyAnnouncement(a.title);
    items.push({ id: a.id, category: c.cat, text: a.title, href: c.href, icon: c.icon, tone: c.tone });
  }
  return items;
}

export default async function HomeDashboard() {
  await getMyProfileSummary();
  const tickerItems = await buildTickerItems();
  return (
    <div className="space-y-4">
      <TribeLiveTicker items={tickerItems} />
      <Reveal><KpiRibbon /></Reveal>
      <Reveal delay={60}><Networking /></Reveal>
      <Reveal delay={120} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CampusCard />
        <ConclaveCard />
        <ReferralCard />
      </Reveal>
      <Reveal delay={160}><RecentActivity /></Reveal>
    </div>
  );
}
