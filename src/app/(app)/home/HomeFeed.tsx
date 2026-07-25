"use client";

import { useState } from "react";

// Center community feed (UI preview). The composer + Wins/Pitches posts need a
// community-posts backend that doesn't exist yet — sample content is shown here
// for local design review only. The pinned announcement is REAL (passed in).
type PinnedAnnouncement = { title: string; body: string | null; date: string } | null;

const TABS = ["All", "Announcements", "Wins", "Pitches", "Events", "New Members", "Group Activity"];

const svg = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Initial({ name }: { name: string }) {
  const i = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return <div className="flex h-full w-full items-center justify-center bg-surface-sunk text-[13px] font-bold text-ink-muted">{i}</div>;
}

export default function HomeFeed({
  userName,
  userPhoto,
  pinned,
}: {
  userName: string;
  userPhoto: string | null;
  pinned: PinnedAnnouncement;
}) {
  const [tab, setTab] = useState("All");

  const quick = [
    { label: "Win / Inspiration", icon: (<svg width="18" height="18" viewBox="0 0 24 24" {...svg}><polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5 12 2" /></svg>) },
    { label: "Elevator Pitch", icon: (<svg width="18" height="18" viewBox="0 0 24 24" {...svg}><polygon points="5 3 19 12 5 21 5 3" /></svg>) },
    { label: "Ask / Query", icon: (<svg width="18" height="18" viewBox="0 0 24 24" {...svg}><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12" y2="17" /></svg>) },
    { label: "Share Resource", icon: (<svg width="18" height="18" viewBox="0 0 24 24" {...svg}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>) },
  ];

  return (
    <div className="space-y-4">
      {/* Composer */}
      <section className="rounded-2xl border border-hairline bg-surface p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-hairline">
            {userPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />
            ) : (
              <Initial name={userName} />
            )}
          </div>
          <button type="button" className="flex-1 rounded-full border border-hairline bg-surface-sunk px-4 py-2.5 text-left text-[14px] text-ink-muted transition-colors hover:border-hairline-bright">
            Share a win, update, or inspiration with your Tribe…
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quick.map((q) => (
            <button key={q.label} type="button" className="flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-[12px] font-semibold text-ink-secondary transition-colors hover:bg-surface-sunk">
              <span className="text-red">{q.icon}</span>
              <span className="truncate">{q.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-hairline">
        <div className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`relative whitespace-nowrap px-3 py-2.5 text-[13px] font-semibold transition-colors ${tab === t ? "text-red" : "text-ink-muted hover:text-ink"}`}
            >
              {t}
              {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-red" />}
            </button>
          ))}
        </div>
        <span className="hidden shrink-0 text-[12px] text-ink-muted lg:block">Sort by: Latest</span>
      </div>

      {/* Pinned announcement (REAL) */}
      {pinned && (
        <article className="rounded-2xl border border-hairline bg-surface p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full"><Initial name="Manan Vasa" /></div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[14px] font-bold text-ink">Manan Vasa
                <span className="rounded bg-red/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-red">Pinned</span>
              </p>
              <p className="text-[11px] text-ink-muted">Announcement · {pinned.date}</p>
              <h3 className="mt-2 text-[16px] font-bold text-ink">{pinned.title}</h3>
              {pinned.body && <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">{pinned.body}</p>}
            </div>
          </div>
        </article>
      )}

      {/* Sample feed posts — PREVIEW ONLY (needs a community-posts backend) */}
      <div className="rounded-xl border border-dashed border-hairline bg-surface-sunk/40 px-4 py-3 text-center text-[12px] text-ink-muted">
        Below are sample posts for design preview — the community feed (wins, pitches, composer) needs a posts backend before it&apos;s live.
      </div>

      <article className="rounded-2xl border border-hairline bg-surface p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full"><Initial name="Sample Participant" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-ink">A participant shared a win</p>
            <p className="text-[11px] text-ink-muted">Sample · Manufacturing</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">
              Delivered our largest automation project this quarter — grateful to the Tribe for the referrals and support.
            </p>
            <div className="mt-3 flex items-center gap-4 text-[12px] text-ink-muted">
              <span className="flex items-center gap-1.5"><svg width="15" height="15" viewBox="0 0 24 24" {...svg}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>18</span>
              <span className="flex items-center gap-1.5"><svg width="15" height="15" viewBox="0 0 24 24" {...svg}><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 21l1.9-5.6a8.5 8.5 0 0 1-.9-3.9A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z" /></svg>6</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
