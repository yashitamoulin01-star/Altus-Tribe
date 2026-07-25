import "server-only";
import { createClient } from "@/lib/supabase/server";

// Events data layer (ADMIN-7). Tribe-readable, admin-writable. Offline/unmigrated
// → bundled sample events so the home widget + admin preview still render.

export type EventKind = "event" | "conclave" | "referral_round" | "orientation";

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  link: string | null;
  startsAt: string;
  endsAt: string | null;
  featured: boolean;
  published: boolean;
  kind: EventKind;
}

// Also treat 42703 (undefined_column) as "schema missing" so a not-yet-applied
// migration (e.g. the published column) degrades to sample data instead of erroring.
const schemaMissing = (e: { code?: string } | null) =>
  e?.code === "PGRST205" || e?.code === "42P01" || e?.code === "42703";

const SAMPLE_EVENTS: EventItem[] = [
  {
    id: "sample-conclave",
    title: "Altus Conclave",
    description: "The flagship in-person gathering of the Tribe.",
    location: "Mumbai",
    link: null,
    startsAt: "2026-09-12T09:00:00Z",
    endsAt: null,
    featured: true,
    published: true,
    kind: "conclave",
  },
  {
    id: "sample-referral",
    title: "Referral Round",
    description: "Weekly structured referrals — bring one intro.",
    location: "Online",
    link: null,
    startsAt: "2026-07-29T04:30:00Z",
    endsAt: null,
    featured: false,
    published: true,
    kind: "referral_round",
  },
];

function mapRow(r: Record<string, unknown>): EventItem {
  return {
    id: r.id as string,
    title: (r.title as string) ?? "Event",
    description: (r.description as string) ?? null,
    location: (r.location as string) ?? null,
    link: (r.link as string) ?? null,
    startsAt: r.starts_at as string,
    endsAt: (r.ends_at as string) ?? null,
    featured: Boolean(r.featured),
    published: r.published === undefined || r.published === null ? true : Boolean(r.published),
    kind: (r.kind as EventKind) ?? "event",
  };
}

// Upcoming events (starts_at >= now-ish), featured first then soonest.
export async function getUpcomingEvents(limit = 5): Promise<EventItem[]> {
  const supabase = await createClient();
  if (!supabase) return SAMPLE_EVENTS.slice(0, limit);

  // Include events that started up to 12h ago so an in-progress one still shows.
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("starts_at", since)
    .order("featured", { ascending: false })
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) {
    if (schemaMissing(error)) return SAMPLE_EVENTS.slice(0, limit);
    return [];
  }
  return (data ?? []).map(mapRow);
}

// All events, newest start first (admin manager).
export async function getAllEvents(): Promise<EventItem[]> {
  const supabase = await createClient();
  if (!supabase) return SAMPLE_EVENTS;

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  if (error) {
    if (schemaMissing(error)) return SAMPLE_EVENTS;
    return [];
  }
  return (data ?? []).map(mapRow);
}

// Computed fallback: the next Wednesday 10:00 AM IST (the standing schedule) when
// no Referral Round has been explicitly scheduled by an admin.
function computedNextReferralRound(): EventItem {
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  let diff = (3 - nowIST.getDay() + 7) % 7; // 3 = Wednesday
  if (diff === 0 && nowIST.getHours() >= 11) diff = 7;
  const start = new Date(nowIST);
  start.setDate(nowIST.getDate() + diff);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(11, 0, 0, 0);
  return {
    id: "computed-referral-round",
    title: "Referral Round",
    description: "A weekly, structured hour to give and receive quality referrals inside the Tribe.",
    location: "Online",
    link: null,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    featured: false,
    published: true,
    kind: "referral_round",
  };
}

// The next upcoming Referral Round — an admin-scheduled one if present, else the
// computed standing Wednesday session. Also used for the "coming up" reminder.
export async function getNextReferralRound(): Promise<EventItem> {
  const upcoming = await getUpcomingEvents(20);
  const scheduled = upcoming
    .filter((e) => e.kind === "referral_round" && e.published)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return scheduled[0] ?? computedNextReferralRound();
}
