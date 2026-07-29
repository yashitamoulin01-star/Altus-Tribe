import Link from "next/link";
import { getCampusResources, getHighlights } from "@/lib/campus";
import { getPublicSettings } from "@/lib/settings";
import { PS_APP_URL, withHttp } from "@/lib/settings-meta";
import { youtubeEmbed } from "@/lib/media";
import CampusBrowser from "./CampusBrowser";
import Reveal from "@/components/Reveal";

export const metadata = { title: "Campus — Altus Tribe" };
export const dynamic = "force-dynamic";

// Admin-managed community channels (app_settings). Only rendered when a link is
// actually set — no dead "#" links.
const SOCIAL_KEYS: { key: string; label: string }[] = [
  { key: "social_youtube", label: "YouTube" },
  { key: "social_facebook", label: "Facebook" },
  { key: "social_instagram", label: "Instagram" },
  { key: "social_linkedin", label: "LinkedIn" },
  { key: "social_x", label: "X" },
];

export default async function CampusPage() {
  const [resources, settings, highlights] = await Promise.all([
    getCampusResources(),
    getPublicSettings(),
    getHighlights(),
  ]);

  const socials = SOCIAL_KEYS.map((s) => ({ label: s.label, url: withHttp(settings[s.key]) })).filter(
    (s): s is { label: string; url: string } => Boolean(s.url),
  );
  const orientationUrl = withHttp(settings.ps_orientation_url);
  const psAppUrl = withHttp(settings.ps_app_url) || PS_APP_URL;
  const featuredVideo = youtubeEmbed(settings.featured_video_url);
  const featuredTitle = settings.featured_video_title;

  return (
    <main className="mx-auto w-full max-w-[1080px] px-6 pt-6 pb-16 sm:px-10">
      <header className="pb-6">
        <p className="kicker mb-3">Campus</p>
        <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink md:text-3xl">
          Keep sharpening.
        </h1>
        <p className="mt-3 max-w-[46ch] text-[15px] leading-snug text-ink-secondary">
          Manan Vasa&apos;s library, member wins, and the playbooks that keep the Tribe
          productive. Save what matters and track what you&apos;ve finished.
        </p>
      </header>

      {featuredVideo && (
        <section className="mb-6 overflow-hidden rounded-xl border border-hairline bg-surface">
          <div className="aspect-video w-full bg-black/40">
            <iframe
              src={featuredVideo}
              title={featuredTitle || "Featured video"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {featuredTitle && (
            <div className="p-5">
              <p className="kicker mb-1">Featured</p>
              <h2 className="text-lg font-semibold text-ink">{featuredTitle}</h2>
            </div>
          )}
        </section>
      )}

      <CampusBrowser resources={resources} />

      {/* Program & Event Highlights — big, clear admin-uploaded photo cards.
          Hidden when no highlights exist (no stock photos). */}
      {highlights.length > 0 && (
        <Reveal as="section" className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-ink">Program &amp; Event Highlights</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {highlights.map((h) => (
              <figure key={h.id} className="group overflow-hidden rounded-xl border border-hairline bg-surface shadow-sm">
                <div className="aspect-[16/10] w-full overflow-hidden bg-surface-sunk">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={h.imageUrl}
                    alt={h.title || "Event highlight"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                {h.title && (
                  <figcaption className="px-5 py-4 text-[15px] font-semibold text-ink">{h.title}</figcaption>
                )}
              </figure>
            ))}
          </div>
        </Reveal>
      )}

      {/* Productivity Shastra ecosystem entry — Altus Tribe is part of PS. */}
      <section className="mt-12 border-t border-hairline pt-10">
        <a
          href={psAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-4 rounded-2xl border border-hairline bg-surface p-6 transition-colors hover:border-red/40 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="kicker mb-1">Ecosystem</p>
            <h2 className="text-lg font-semibold text-ink">Productivity Shastra App</h2>
            <p className="mt-1 max-w-[52ch] text-[14px] leading-relaxed text-ink-secondary">
              Altus Tribe is part of the Productivity Shastra ecosystem. Open your PS
              dashboard — programmes, tools and your productivity system.
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-red px-5 py-2.5 text-[14px] font-medium text-paper transition-colors group-hover:bg-red-hover">
            Open PS App ↗
          </span>
        </a>

        {/* PS ecosystem features — honest deep-links into the PS app (until a
            native/synced integration exists). */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Tribe Learning", desc: "Courses & programmes" },
            { label: "Karma Bank", desc: "Give & track karma" },
            { label: "Gratitude Space", desc: "Share gratitude" },
            { label: "Refer to Someone", desc: "Refer a founder" },
          ].map((f) => (
            <a
              key={f.label}
              href={psAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-hairline bg-surface p-4 transition-colors hover:border-red/40"
            >
              <span className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-ink">{f.label}</span>
                <span className="text-ink-muted transition-colors group-hover:text-red" aria-hidden>↗</span>
              </span>
              <span className="mt-0.5 text-[12px] text-ink-muted">{f.desc}</span>
            </a>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-ink-muted">These open in the Productivity Shastra app.</p>
      </section>

      {/* PS Orientation + channels (static entry points) */}
      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-surface p-6">
          <p className="kicker mb-2">Invite to PS Orientation</p>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            Know someone who belongs in the Productivity School? Invite them to the
            next orientation.
          </p>
          {orientationUrl ? (
            <a href={orientationUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-lg bg-red px-5 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-red-hover">
              Send an invite →
            </a>
          ) : (
            <p className="mt-4 text-[13px] text-ink-muted">Invite link coming soon.</p>
          )}
        </div>
        <div className="rounded-xl border border-hairline bg-surface p-6">
          <p className="kicker mb-2">Community channels</p>
          {socials.length ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-hairline px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted">
                  {s.label}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-[13px] text-ink-muted">Channels coming soon.</p>
          )}
        </div>
      </section>

      <div className="border-t border-hairline py-10">
        <Link href="/home" className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink">
          ← Back to Tribe
        </Link>
      </div>
    </main>
  );
}
