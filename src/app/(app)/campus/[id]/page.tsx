import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampusResource } from "@/lib/campus";
import { youtubeEmbed } from "@/lib/media";
import ResourceActions from "../ResourceActions";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  video: "Video",
  brochure: "Playbook",
  inspiration: "Inspiration",
};

export default async function CampusResourcePage({
  params,
}: PageProps<"/campus/[id]">) {
  const { id } = await params;
  const r = await getCampusResource(id);
  if (!r) notFound();

  const embed = youtubeEmbed(r.externalUrl);
  const isPdf = Boolean(r.fileUrl);

  return (
    <main className="mx-auto w-full max-w-[860px] px-6 pt-6 pb-24 sm:px-10">
      <nav className="py-4">
        <Link href="/campus" className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink">
          ← Campus
        </Link>
      </nav>

      {/* Player / viewer */}
      {embed ? (
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-hairline bg-black">
          <iframe
            src={embed}
            title={r.title}
            className="h-full w-full"
            allow="accelerated-encoding; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : isPdf ? (
        <div className="h-[70vh] w-full overflow-hidden rounded-xl border border-hairline bg-surface-sunk">
          <iframe src={r.fileUrl!} title={r.title} className="h-full w-full" />
        </div>
      ) : r.externalUrl && r.externalUrl !== "#" ? (
        <a
          href={r.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="flex aspect-video w-full items-center justify-center rounded-xl border border-hairline bg-surface-sunk text-[15px] text-red transition-colors hover:bg-surface"
        >
          Open resource →
        </a>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-hairline bg-surface-sunk font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
          {KIND_LABEL[r.kind] ?? r.kind}
        </div>
      )}

      {/* Meta */}
      <div className="mt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
          {KIND_LABEL[r.kind] ?? r.kind}
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.015em] text-ink md:text-3xl">
          {r.title}
        </h1>
        {r.description && (
          <p className="mt-3 text-[16px] leading-[1.7] text-ink-secondary">{r.description}</p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ResourceActions resourceId={r.id} bookmarked={r.bookmarked} completed={r.completed} showComplete />
          {r.fileUrl && (
            <a href={r.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-hairline px-3.5 py-1.5 text-[13px] text-ink transition-colors hover:border-ink-muted">
              Download
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
