import type { Member } from "@/lib/members";

const KIND_LABEL: Record<string, string> = {
  brochure: "Brochure",
  video: "Video",
  image: "Image",
  case_study: "Case study",
};

// Business presence — brochures/videos/case studies as preview cards plus the
// member's public channels (website/LinkedIn/Instagram/YouTube/email links).
export default function PortfolioGallery({ member }: { member: Member }) {
  const hasWork = member.work.length > 0;
  const hasLinks = member.presence.length > 0;
  if (!hasWork && !hasLinks) return null;

  return (
    <div className="space-y-6">
      {hasWork && (
        <div className="grid gap-3 sm:grid-cols-2">
          {member.work.map((w) => (
            <a
              key={`${w.kind}-${w.title}`}
              href={w.href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-hairline bg-surface-sunk p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-hairline-bright"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-muted transition-colors group-hover:text-red" aria-hidden>
                {w.kind === "video" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-ink transition-colors group-hover:text-red">{w.title || KIND_LABEL[w.kind]}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">{KIND_LABEL[w.kind] ?? w.kind}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {hasLinks && (
        <div className="flex flex-wrap gap-2">
          {member.presence.map((p) => (
            <a
              key={p.platform}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-hairline px-3.5 py-2 text-[14px] text-ink transition-all duration-200 hover:border-hairline-bright hover:bg-surface-hover"
            >
              {p.platform} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
