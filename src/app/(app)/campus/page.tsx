import Link from "next/link";
import { getCampusResources } from "@/lib/campus";
import { getPublicSettings } from "@/lib/settings";
import { youtubeEmbed } from "@/lib/media";
import CampusBrowser from "./CampusBrowser";
import CircularGallery from "@/components/CircularGallery";

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
  const [resources, settings] = await Promise.all([
    getCampusResources(),
    getPublicSettings(),
  ]);

  const socials = SOCIAL_KEYS.map((s) => ({ label: s.label, url: settings[s.key] })).filter(
    (s): s is { label: string; url: string } => Boolean(s.url),
  );
  const orientationUrl = settings.ps_orientation_url || "";
  const featuredVideo = youtubeEmbed(settings.featured_video_url);
  const featuredTitle = settings.featured_video_title;

  return (
    <main className="mx-auto w-full max-w-[1080px] px-6 pt-8 pb-24 sm:px-10">
      <header className="pb-6">
        <p className="kicker mb-4">Campus</p>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
          Keep sharpening.
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg leading-snug text-ink-secondary">
          Manan Vasa&apos;s library, member wins, and the playbooks that keep the Tribe
          productive. Save what matters and track what you&apos;ve finished.
        </p>
      </header>

      {featuredVideo && (
        <section className="mb-10 overflow-hidden rounded-2xl border border-hairline bg-surface">
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

      {/* React Bits 3D Circular Showcase Gallery */}
      <section className="mt-12 rounded-2xl border border-hairline/80 bg-surface/60 p-6 backdrop-blur-md">
        <p className="kicker mb-2">Interactive Showcase</p>
        <h2 className="text-xl font-semibold text-ink mb-4">Program & Event Highlights</h2>
        <div className="h-[360px] w-full rounded-xl overflow-hidden bg-black/40">
          <CircularGallery
            bend={3}
            textColor="#ffffff"
            borderRadius={0.08}
            scrollSpeed={2.5}
            scrollEase={0.05}
          />
        </div>
      </section>

      {/* PS Orientation + channels (static entry points) */}
      <section className="mt-12 grid gap-5 border-t border-hairline pt-10 md:grid-cols-2">
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
