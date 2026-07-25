"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CampusResource, CampusKind } from "@/lib/campus";
import { youtubeThumb } from "@/lib/media";
import ResourceActions from "./ResourceActions";

const KIND_LABEL: Record<CampusKind, string> = {
  video: "Video",
  brochure: "Playbook",
  inspiration: "Inspiration",
  highlight: "Highlight",
};

type Category = "all" | CampusKind | "saved";
const TABS: { key: Category; label: string }[] = [
  { key: "all", label: "All Resources" },
  { key: "video", label: "Videos" },
  { key: "brochure", label: "Playbooks" },
  { key: "inspiration", label: "Inspiration" },
  { key: "saved", label: "Saved Library" },
];

function CampusCard({ r }: { r: CampusResource }) {
  const thumb = r.thumbnailUrl || youtubeThumb(r.externalUrl);
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-hairline/80 bg-surface/90 backdrop-blur-md transition-all duration-300 hover:border-hairline-bright hover:shadow-xl hover:shadow-black/50">
      <Link href={`/campus/${r.id}`} className="block relative">
        <div className="relative aspect-video w-full overflow-hidden bg-surface-sunk">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted bg-surface-sunk">
              {KIND_LABEL[r.kind]}
            </div>
          )}
          {r.kind === "video" && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-90 group-hover:opacity-100 transition-opacity">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red text-white shadow-lg shadow-red/30 transition-transform duration-200 group-hover:scale-110" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-red font-semibold">{KIND_LABEL[r.kind]}</span>
          {r.completed && (
            <span className="rounded-full bg-red/10 px-2 py-0.5 font-mono text-[9px] text-red uppercase tracking-wider">
              Completed
            </span>
          )}
        </div>
        <Link href={`/campus/${r.id}`} className="text-[16px] font-semibold leading-snug text-ink transition-colors group-hover:text-red">
          {r.title}
        </Link>
        {r.description && <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink-secondary">{r.description}</p>}
        <div className="mt-auto pt-4">
          <ResourceActions resourceId={r.id} bookmarked={r.bookmarked} completed={r.completed} />
        </div>
      </div>
    </div>
  );
}

export default function CampusBrowser({ resources }: { resources: CampusResource[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category>("all");

  const completed = resources.filter((r) => r.completed).length;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (cat === "saved" && !r.bookmarked) return false;
      if (cat !== "all" && cat !== "saved" && r.kind !== cat) return false;
      if (!q) return true;
      return `${r.title} ${r.description ?? ""}`.toLowerCase().includes(q);
    });
  }, [resources, query, cat]);

  return (
    <div className="space-y-6">
      {/* Search & Stats Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-hairline/70 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Campus Knowledge</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            {completed} of {resources.length} completed
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources, guides & videos…"
            aria-label="Search Campus resources"
            className="w-full rounded-xl border border-hairline bg-surface-sunk/80 px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-muted focus:border-red focus:outline-none focus:ring-2 focus:ring-red/20 transition-all"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setCat(t.key)}
            className={`rounded-xl px-4 py-2 text-[13px] font-medium transition-all ${
              cat === t.key
                ? "bg-red text-white shadow-md shadow-red/20"
                : "border border-hairline bg-surface/70 text-ink-secondary hover:border-hairline-bright hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <CampusCard key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-hairline rounded-2xl bg-surface/40">
          <p className="text-2xl mb-2">📚</p>
          <p className="text-[15px] font-medium text-ink">No resources found</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            {cat === "saved" ? "Nothing saved yet — tap ☆ Save on any resource." : "Try adjusting your search filter."}
          </p>
        </div>
      )}
    </div>
  );
}

