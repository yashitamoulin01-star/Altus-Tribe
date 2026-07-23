import Link from "next/link";
import type { Member } from "@/lib/members";
import type { ConnectionState } from "@/lib/connections";
import { toWaNumber } from "@/lib/phone";
import ShareButtons from "@/components/ShareButtons";
import MessageMemberButton from "@/components/MessageMemberButton";
import ConnectButton from "@/components/ConnectButton";

const btn =
  "rounded-lg border border-hairline px-4 py-2 text-[14px] text-ink transition-all duration-200 hover:border-hairline-bright hover:bg-surface-hover";

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
  // Chat routing (member's own choice, made in onboarding):
  //  • Shared a WhatsApp number + allows it → one-click WhatsApp is the chat action.
  //  • No WhatsApp (or DND) → fall back to the in-app 1:1 chat.
  // This keeps the reliable channel (WhatsApp) primary for those who opted in,
  // and only uses in-app messaging for members who didn't share a number.
  const waNumber = toWaNumber(member.whatsapp || member.contact?.cellNo || "");
  const waAllowed = member.whatsappDmPref
    ? member.whatsappDmPref === "yes"
    : member.whatsappDm !== false;
  const waLink = waNumber && waAllowed ? `https://wa.me/${waNumber}` : null;
  const email = member.contact?.workEmail ?? null;
  const website = member.presence.find((p) => p.platform === "Website")?.url ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {!isOwner && <ConnectButton profileId={member.id} initialState={connectionState} />}
        {waLink ? (
          <a href={waLink} target="_blank" rel="noreferrer" className={btn}>
            Message on WhatsApp
          </a>
        ) : (
          canMessage && <MessageMemberButton profileId={member.id} />
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
