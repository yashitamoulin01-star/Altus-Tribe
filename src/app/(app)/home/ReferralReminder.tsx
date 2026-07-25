import { getNextReferralRound } from "@/lib/events";
import ReminderBanner from "./ReminderBanner";

// Server: shows the reminder banner only when the next Referral Round is within
// 24h (the "day before" nudge) or currently live. Otherwise renders nothing.
export default async function ReferralReminder() {
  const rr = await getNextReferralRound();
  // eslint-disable-next-line react-hooks/purity -- server component; request-time clock is intended
  const now = Date.now();
  const ms = new Date(rr.startsAt).getTime() - now;
  const endMs = rr.endsAt ? new Date(rr.endsAt).getTime() - now : ms + 3600000;
  const live = ms <= 0 && endMs > 0;
  const withinDay = ms > 0 && ms <= 24 * 3600000;
  if (!live && !withinDay) return null;
  return <ReminderBanner startsAt={rr.startsAt} live={live} />;
}
