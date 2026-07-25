// Dependency-free SVG charts for admin analytics. Palette: red + neutral greys.
// Server-rendered (no client JS). Red = the highlighted/primary series.

const GREYS = ["var(--color-red)", "#a1a1aa", "#71717a", "#d4d4d8", "#52525b", "#e4e4e7"];

// Donut — proportion breakdown (e.g. member status).
export function DonutChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 52;
  const C = 2 * Math.PI * R;
  // Cumulative fraction BEFORE each segment (no mutable accumulator across render).
  const before = data.map((_, i) => data.slice(0, i).reduce((s, d) => s + d.value, 0) / total);
  const segs = data.map((d, i) => ({
    color: GREYS[i % GREYS.length],
    dash: (d.value / total) * C,
    offset: -before[i] * C,
    label: d.label,
    value: d.value,
  }));
  return (
    <div className="flex items-center gap-6">
      <svg width="132" height="132" viewBox="0 0 132 132" className="shrink-0 -rotate-90">
        <circle cx="66" cy="66" r={R} fill="none" stroke="var(--color-hairline)" strokeWidth="16" />
        {segs.map((s, i) => (
          <circle
            key={i}
            cx="66" cy="66" r={R} fill="none"
            stroke={s.color} strokeWidth="16"
            strokeDasharray={`${s.dash} ${C - s.dash}`}
            strokeDashoffset={s.offset}
          />
        ))}
      </svg>
      <ul className="space-y-1.5">
        {segs.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="text-ink-secondary">{s.label}</span>
            <span className="font-semibold tabular-nums text-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Vertical bars — trend over time (e.g. signups per month).
export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-40 items-end gap-3">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-[11px] font-semibold tabular-nums text-ink-muted">{d.value}</span>
          <div className="flex w-full items-end justify-center" style={{ height: 110 }}>
            <div
              className="w-full max-w-[36px] rounded-t-md bg-red/85 transition-all"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
            />
          </div>
          <span className="text-[11px] text-ink-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Horizontal bars — compare metrics (e.g. engagement counts).
export function HBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-[13px]">
            <span className="text-ink-secondary">{d.label}</span>
            <span className="font-semibold tabular-nums text-ink">{d.value}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-sunk">
            <div className="h-full rounded-full bg-red/85" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
