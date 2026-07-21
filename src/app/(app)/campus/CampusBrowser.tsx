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
};

type Category = "all" | CampusKind | "saved";
const TABS: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "video", label: "Videos" },
  { key: "brochure", label: "Playbooks" },
  { key: "inspiration", label: "Inspiration" },
  { key: "saved", label: "Saved" },
];

function CampusCard({ r }: { r: CampusResource }) {
  const thumb = r.thumbnailUrl || youtubeThumb(r.externalUrl);
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface transition-colors hover:border-ink-muted">
      <Link href={`/campus/${r.id}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-surface-sunk">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
              {KIND_LABEL[r.kind]}
            </div>
          )}
          {r.kind === "video" && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-paper" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <span className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">{KIND_LABEL[r.kind]}</span>
        <Link href={`/campus/${r.id}`} className="text-[16px] font-medium leading-snug text-ink transition-colors hover:text-red">
          {r.title}
        </Link>
        {r.description && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-muted">{r.description}</p>}
        <div className="mt-3 pt-1">
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
    <div>
      {/* Progress + search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          {completed} of {resources.length} completed
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the library…"
          aria-label="Search Campus resources"
          className="w-full rounded-lg border border-hairline bg-surface-sunk px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none sm:w-72"
        />
      </div>

      {/* Category tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setCat(t.key)}
            className={`rounded-full border px-3.5 py-1.5 text-[14px] transition-colors ${
              cat === t.key ? "border-ink bg-ink text-paper" : "border-hairline bg-surface-sunk text-ink-secondary hover:border-ink-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {results.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <CampusCard key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-[15px] text-ink-muted">
          {cat === "saved" ? "Nothing saved yet — tap ☆ Save on any resource." : "No resources match that."}
        </p>
      )}
    </div>
  );
}
