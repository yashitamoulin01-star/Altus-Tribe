import { nextConclave } from "@/lib/conclave";
import { getUpcomingEvents } from "@/lib/events";
import { Card, WidgetHeader } from "./_shared";

// Next date (>= today) that falls on the given weekday (0=Sun … 3=Wed).
function nextWeekday(weekday: number): Date {
  const d = new Date();
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}
const fmtDay = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const fmtConclave = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};
const fmtEvent = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// Admin-curated upcoming events; falls back to the standing programme (Conclave,
// weekly Referral Round, PS Orientation) when none have been scheduled yet.
export default async function EventsWidget() {
  const scheduled = await getUpcomingEvents(4);

  const events =
    scheduled.length > 0
      ? scheduled.map((e) => ({
          title: e.title,
          when: [fmtEvent(e.startsAt), e.location].filter(Boolean).join(" · "),
          tag: e.featured ? "Featured" : "Event",
        }))
      : [
          { title: nextConclave.edition, when: `${fmtConclave(nextConclave.date)} · ${nextConclave.city}`, tag: "Conclave" },
          { title: "Referral Round", when: `${fmtDay(nextWeekday(3))} · 10–11am`, tag: "Weekly" },
          { title: "PS Orientation", when: "Invite a guest — link inside Campus", tag: "Open" },
        ];

  return (
    <Card>
      <WidgetHeader title="Upcoming" href="/campus" cta="Campus" />
      <ul className="divide-y divide-hairline">
        {events.map((e) => (
          <li key={e.title} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="shrink-0 rounded bg-surface-sunk px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">
              {e.tag}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium text-ink">{e.title}</p>
              <p className="truncate text-[13px] text-ink-muted">{e.when}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
