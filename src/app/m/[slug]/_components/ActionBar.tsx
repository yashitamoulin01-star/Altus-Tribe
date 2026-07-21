import Link from "next/link";
import type { Member } from "@/lib/members";
import type { ConnectionState } from "@/lib/connections";
import ShareButtons from "@/components/ShareButtons";
import MessageMemberButton from "@/components/MessageMemberButton";
import ConnectButton from "@/components/ConnectButton";

const btn =
  "rounded-lg border border-hairline px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted";

// Quick actions for the profile: message, WhatsApp, email, website, edit (owner),
// share + download PDF. Contact links use only fields the viewer is allowed to
// see (already gated in the data layer).
export default function ActionBar({
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
  const cell = member.contact?.cellNo?.replace(/[^0-9]/g, "") ?? "";
  const waNumber = cell.length === 10 ? `91${cell}` : cell;
  const waLink = cell && member.whatsappDm !== false ? `https://wa.me/${waNumber}` : null;
  const email = member.contact?.workEmail ?? null;
  const website = member.presence.find((p) => p.platform === "Website")?.url ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {!isOwner && <ConnectButton profileId={member.id} initialState={connectionState} />}
        {canMessage && <MessageMemberButton profileId={member.id} />}
        {waLink && (
          <a href={waLink} target="_blank" rel="noreferrer" className={btn}>
            WhatsApp
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className={btn}>
            Email
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noreferrer" className={btn}>
            Website
          </a>
        )}
        {isOwner && (
          <Link href="/account/edit" className={btn}>
            Edit profile
          </Link>
        )}
      </div>
      <div className="print-hide">
        <ShareButtons slug={member.slug} name={member.fullName} showPdf />
      </div>
    </div>
  );
}
