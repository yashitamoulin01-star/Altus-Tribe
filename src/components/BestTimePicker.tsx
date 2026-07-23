"use client";

// Structured "best time to connect" (spec §5/U). Serializes into the EXISTING
// best_time text column as "Mon, Wed, Fri · 10:00–19:00" — reconstructable, and
// human-readable where the value is displayed on the profile. Legacy free-text
// values that don't match are preserved and editable via a raw fallback.

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const RE = /^([A-Za-z, ]+)\s·\s(\d{1,2}:\d{2})\s*–\s*(\d{1,2}:\d{2})$/;

function parse(value: string): { days: string[]; from: string; to: string } | null {
  const m = (value || "").trim().match(RE);
  if (!m) return null;
  const days = m[1].split(",").map((s) => s.trim()).filter((d) => DAYS.includes(d));
  return { days, from: m[2], to: m[3] };
}

export default function BestTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const parsed = parse(value);
  const isLegacy = Boolean(value.trim()) && !parsed;
  const days = parsed?.days ?? [];
  const from = parsed?.from ?? "";
  const to = parsed?.to ?? "";

  const emit = (nextDays: string[], nextFrom: string, nextTo: string) => {
    if (nextDays.length === 0 && !nextFrom && !nextTo) {
      onChange("");
      return;
    }
    const dayStr = nextDays.length ? nextDays.join(", ") : "Any day";
    onChange(`${dayStr} · ${nextFrom || "00:00"}–${nextTo || "00:00"}`);
  };

  if (isLegacy) {
    // Preserve unparseable historical text; let them keep or clear it.
    return (
      <div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-hairline bg-surface-sunk px-4 py-3 text-[16px] text-ink focus:border-red/50 focus:outline-none focus:ring-4 focus:ring-red/10"
        />
        <button
          type="button"
          onClick={() => onChange("")}
          className="mt-1.5 text-[12px] text-ink-muted underline hover:text-ink"
        >
          Clear and use the day/time picker
        </button>
      </div>
    );
  }

  const toggleDay = (day: string) =>
    emit(days.includes(day) ? days.filter((d) => d !== day) : [...days, day], from, to);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day) => {
          const on = days.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`rounded-lg border px-3 py-1.5 text-[13px] transition-all ${
                on ? "border-red/40 bg-red-muted text-red" : "border-hairline text-ink-muted hover:text-ink"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-[14px] text-ink-secondary">
        <span>From</span>
        <input
          type="time"
          value={from}
          onChange={(e) => emit(days, e.target.value, to)}
          className="rounded-lg border border-hairline bg-surface-sunk px-3 py-2 text-ink focus:border-red/50 focus:outline-none"
        />
        <span>to</span>
        <input
          type="time"
          value={to}
          onChange={(e) => emit(days, from, e.target.value)}
          className="rounded-lg border border-hairline bg-surface-sunk px-3 py-2 text-ink focus:border-red/50 focus:outline-none"
        />
      </div>
    </div>
  );
}
