import Link from "next/link";
import { Card } from "./_shared";

// Referral Round highlight (PRD Feature #11) — the Wednesday session.
export default function ReferralWidget() {
  return (
    <Card className="bg-red/5">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-red">
        Referral Round
      </p>
      <p className="mt-2 text-[17px] font-semibold text-ink">
        Every Wednesday, 10–11am
      </p>
      <p className="mt-1 text-[14px] leading-relaxed text-ink-muted">
        Give and get warm introductions with the Tribe. Free for members.
      </p>
      <Link
        href="/refer"
        className="mt-4 inline-block rounded-lg bg-red px-5 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-red-hover"
      >
        Refer someone →
      </Link>
    </Card>
  );
}
