import "server-only";
import { getAnnouncements } from "@/lib/community";
import { getNextReferralRound } from "@/lib/events";
import type { TickerItem } from "@/components/TribeLiveTicker";

// Real Tribe Live ticker data: the live next Referral Round + latest
// announcements, classified into categories with an icon + link. Built server-
// side in the app layout so the ticker is global (attached under the nav on
// every page).

const TICK = {
  founder: { cat: "Founder Message", href: "/sacred-space", tone: "text-red", icon: '<polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5 12 2"/>' },
  event: { cat: "Event", href: "/conclave", tone: "text-[#9333EA]", icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
  campus: { cat: "Campus", href: "/campus", tone: "text-[#0284C7]", icon: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>' },
  referral: { cat: "Referral", href: "/referral-rounds", tone: "text-[#EA580C]", icon: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>' },
  community: { cat: "Community", href: "/notifications", tone: "text-[#16A34A]", icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>' },
};

function classify(title: string) {
  const t = title.toLowerCase();
  if (/manan|founder|sacred/.test(t)) return TICK.founder;
  if (/conclave|event|summit|register|seat/.test(t)) return TICK.event;
  if (/campus|course|resource|learn/.test(t)) return TICK.campus;
  if (/referral|refer/.test(t)) return TICK.referral;
  return TICK.community;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function buildTickerItems(): Promise<TickerItem[]> {
  const [anns, rr] = await Promise.all([getAnnouncements(), getNextReferralRound()]);
  const items: TickerItem[] = [
    { id: "live-rr", category: TICK.referral.cat, text: `Next Referral Round — ${fmtDate(rr.startsAt)}`, href: TICK.referral.href, icon: TICK.referral.icon, tone: TICK.referral.tone },
  ];
  for (const a of anns.slice(0, 6)) {
    const c = classify(a.title);
    items.push({ id: a.id, category: c.cat, text: a.title, href: c.href, icon: c.icon, tone: c.tone });
  }
  return items;
}
