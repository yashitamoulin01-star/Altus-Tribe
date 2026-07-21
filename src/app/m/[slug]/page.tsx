import Link from "next/link";
import { notFound } from "next/navigation";
import { getMember } from "@/lib/members-data";
import { type Member } from "@/lib/members";
import { getUser } from "@/lib/auth";
import { getConnectionState, type ConnectionState } from "@/lib/connections";
import ProfileHeader from "./_components/ProfileHeader";
import ActionBar from "./_components/ActionBar";
import ViewPing from "./_components/ViewPing";
import AddressCard from "./_components/AddressCard";
import PortfolioGallery from "./_components/PortfolioGallery";
import SectionCard, { Detail, DetailGrid, Prose } from "./_components/SectionCard";

// Personalized per viewer (owner-only + hidden fields stripped, "Message" gated
// on the signed-in user), so it reads cookies and renders dynamically.
export const dynamic = "force-dynamic";

const OPEN_TO_LABELS: Record<string, string> = {
  mentoring: "Mentoring",
  partnerships: "Partnerships",
  referrals: "Referrals",
  speaking: "Speaking",
  hiring: "Hiring",
};
const MODE_LABELS: Record<string, string> = {
  call: "Call",
  whatsapp: "WhatsApp",
  email: "Email",
  dnd: "DND",
};

function fmtDate(iso?: string | null) {
  const s = (iso ?? "").trim();
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function ProfileView({
  member,
  isOwner,
  canMessage,
  connectionState,
}: {
  member: Member;
  isOwner: boolean;
  canMessage: boolean;
  connectionState: ConnectionState;
}) {
  const b = member.business;
  const modes = (member.bestModes ?? []).map((m) => MODE_LABELS[m] ?? m).join(", ");

  const aboutHas =
    member.knownFor || member.about || member.expertise.length ||
    member.birthDate || member.bloodGroup || member.maritalStatus || member.anniversary;
  const businessHas =
    b || member.natureOfBusiness || member.usp || member.offerings.length || member.openTo.length || member.brandNames;
  const contact = member.contact;
  const contactHas =
    contact?.cellNo || contact?.altNo || contact?.workEmail || contact?.personalEmail ||
    member.bestTime || modes || member.whatsappDm;
  const locations = [
    ["Office", member.addresses?.work],
    ["Home", member.addresses?.home],
    ["Factory / Warehouse", member.addresses?.factory],
  ] as const;
  const locationsHas = locations.some(([, a]) => Boolean(a));
  const portfolioHas = member.work.length || member.presence.length;
  const networkingHas =
    member.areasOfInterest || member.networkGroups || member.canConnect ||
    member.wantConnect || member.favouriteTools || member.purpose;
  const communityHas =
    member.interestedHelping || member.interestedCoaching || member.interestedNetworking || member.contribution;
  const journeyHas =
    member.programBenefitWork || member.programBenefitPersonal ||
    member.cqBatch || member.psBatch || member.bssBatch ||
    (member.conclavesAttended != null && member.conclavesAttended > 0);

  return (
    <main className="mx-auto w-full max-w-[960px] px-5 pb-24 sm:px-8 lg:pb-16">
      {!isOwner && member.id && <ViewPing ownerId={member.id} />}
      <nav className="print-hide flex items-center justify-between py-5">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink">
          ← The Tribe
        </Link>
      </nav>

      <ProfileHeader member={member} />

      <div className="mt-7">
        <ActionBar
          member={member}
          isOwner={isOwner}
          canMessage={canMessage}
          connectionState={connectionState}
        />
      </div>

      <div className="mt-8 space-y-5">
        {/* About */}
        {aboutHas && (
          <SectionCard label="About">
            <div className="space-y-5">
              {member.knownFor && (
                <p className="text-2xl leading-tight tracking-tight text-ink">{member.knownFor}</p>
              )}
              <Prose value={member.about} />
              {member.expertise.length > 0 && (
                <p className="text-[16px] leading-relaxed text-ink-secondary">
                  {member.expertise.join("  /  ")}
                </p>
              )}
              <DetailGrid>
                <Detail label="Birth date" value={fmtDate(member.birthDate)} />
                <Detail label="Blood group" value={member.bloodGroup} />
                <Detail label="Marital status" value={member.maritalStatus} />
                <Detail label="Anniversary" value={fmtDate(member.anniversary)} />
              </DetailGrid>
            </div>
          </SectionCard>
        )}

        {/* Business */}
        {businessHas && (
          <SectionCard label="Business">
            <div className="space-y-5">
              {b && (
                <div>
                  <p className="text-xl text-ink">{b.name}</p>
                  <p className="mt-1 text-[15px] text-ink-muted">
                    {[b.foundedYear && `Founded ${b.foundedYear}`, b.teamSize].filter(Boolean).join(" · ")}
                  </p>
                  {b.description && (
                    <p className="mt-3 text-[16px] leading-[1.7] text-ink-secondary">{b.description}</p>
                  )}
                </div>
              )}
              <Detail label="Brand names" value={member.brandNames} />
              <Prose label="Nature of business" value={member.natureOfBusiness} />
              <Prose label="Unique selling point" value={member.usp} />
              {member.offerings.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">What I do</p>
                  <ul className="space-y-3">
                    {member.offerings.map((o) => (
                      <li key={o.title}>
                        <p className="text-[16px] text-ink">{o.title}</p>
                        {o.description && <p className="mt-0.5 text-[15px] leading-relaxed text-ink-secondary">{o.description}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {member.openTo.length > 0 && (
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {member.openTo.map((o) => (
                    <span key={o} className="text-[15px] text-ink"><span className="text-positive">✔</span> {OPEN_TO_LABELS[o] ?? o}</span>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Contact */}
        {contactHas && (
          <SectionCard label="Contact">
            <DetailGrid>
              <Detail label="Cell" value={contact?.cellNo} href={contact?.cellNo ? `tel:${contact.cellNo}` : undefined} />
              <Detail label="Alternate" value={contact?.altNo} href={contact?.altNo ? `tel:${contact.altNo}` : undefined} />
              <Detail label="Work email" value={contact?.workEmail} href={contact?.workEmail ? `mailto:${contact.workEmail}` : undefined} />
              <Detail label="Personal email" value={contact?.personalEmail} href={contact?.personalEmail ? `mailto:${contact.personalEmail}` : undefined} />
              <Detail label="Best time to connect" value={member.bestTime} />
              <Detail label="Best mode to connect" value={modes} />
              {member.whatsappDm ? <Detail label="WhatsApp DM" value="Open to WhatsApp messages" /> : null}
            </DetailGrid>
          </SectionCard>
        )}

        {/* Locations */}
        {locationsHas && (
          <SectionCard label="Locations">
            <div className="grid gap-4 sm:grid-cols-2">
              {locations.map(([label, a]) => (a ? <AddressCard key={label} label={label} address={a} /> : null))}
            </div>
          </SectionCard>
        )}

        {/* Business presence / portfolio */}
        {portfolioHas ? (
          <SectionCard label="Business presence">
            <PortfolioGallery member={member} />
          </SectionCard>
        ) : null}

        {/* Networking */}
        {networkingHas && (
          <SectionCard label="Networking">
            <div className="space-y-5">
              <Prose label="Areas of interest" value={member.areasOfInterest} />
              <Prose label="Associations & forums" value={member.networkGroups} />
              <Prose label="Can connect others to" value={member.canConnect} />
              <Prose label="Wants introductions to" value={member.wantConnect} />
              <Detail label="Favourite tools" value={member.favouriteTools} />
              <Prose label="Purpose / philosophy" value={member.purpose} />
            </div>
          </SectionCard>
        )}

        {/* Community */}
        {communityHas && (
          <SectionCard label="Community">
            <div className="space-y-5">
              <DetailGrid>
                <Detail label="Open to helping" value={member.interestedHelping} />
                <Detail label="Open to coaching" value={member.interestedCoaching} />
                <Detail label="Business networking" value={member.interestedNetworking} />
              </DetailGrid>
              <Prose label="Contribution to the Tribe" value={member.contribution} />
            </div>
          </SectionCard>
        )}

        {/* Program journey / achievements */}
        {journeyHas && (
          <SectionCard label="Program journey">
            <div className="space-y-5">
              <Prose label="How the programs helped at work" value={member.programBenefitWork} />
              <Prose label="How the programs helped personally" value={member.programBenefitPersonal} />
              <DetailGrid>
                <Detail label="CQ batch" value={member.cqBatch} />
                <Detail label="PS batch" value={member.psBatch} />
                <Detail label="BSS batch" value={member.bssBatch} />
                <Detail
                  label="Conclaves attended"
                  value={member.conclavesAttended != null && member.conclavesAttended > 0 ? String(member.conclavesAttended) : ""}
                />
              </DetailGrid>
            </div>
          </SectionCard>
        )}
      </div>
    </main>
  );
}

export default async function Page({ params }: PageProps<"/m/[slug]">) {
  const { slug } = await params;
  const [member, viewer] = await Promise.all([getMember(slug), getUser()]);
  if (!member) notFound();
  const isOwner = Boolean(viewer && member.id && viewer.id === member.id);
  const canMessage = Boolean(viewer && member.id && viewer.id !== member.id);
  const connectionState =
    viewer && member.id && !isOwner ? await getConnectionState(member.id) : "self";
  return (
    <ProfileView
      member={member}
      isOwner={isOwner}
      canMessage={canMessage}
      connectionState={connectionState}
    />
  );
}
