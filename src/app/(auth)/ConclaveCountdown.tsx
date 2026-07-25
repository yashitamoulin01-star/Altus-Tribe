"use client";

import { useEffect, useState } from "react";
import { nextConclave } from "@/lib/conclave";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return { d, h, m, s };
}

// Live countdown + details for the next conclave (#8, #9, #10). Renders on the
// signup screen to give the invitation a sense of occasion.
export default function ConclaveCountdown() {
  const target = new Date(nextConclave.date).getTime();
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const dateLabel = new Date(nextConclave.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const cells: [number, string][] = [
    [t.d, "days"],
    [t.h, "hrs"],
    [t.m, "min"],
    [t.s, "sec"],
  ];

  return (
    <div className="mb-6 rounded-[2px] border border-[#e4e4e2] bg-[#f4f4f3] px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-red">
          {nextConclave.edition}
        </span>
        <span className="text-[12px] text-[#5f5f5f]">
          {dateLabel} · {nextConclave.city}
        </span>
      </div>
      <div className="mt-3 flex gap-3">
        {cells.map(([value, label]) => (
          <div key={label} className="flex flex-col items-center">
            <span className="font-mono text-[18px] font-semibold tabular-nums text-[#111111]">
              {String(value).padStart(2, "0")}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#9a9a9a]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
