import { getAdminContext } from "@/lib/admin";
import { getAccessContainer } from "@/lib/access/container";
import { sortRequestsForQueue, conclaveBadge, whatsappLink } from "@/lib/access/logic";
import type { AdminRole } from "@/lib/access/types";
import RequestQueue, { type RequestRow } from "./RequestQueue";

export const metadata = { title: "Access requests — Altus Tribe" };

// Builds enriched view-models by joining each access request with its allowlist
// entry (badge, PS-link, location, status). Read-only assembly via the container;
// all mutations go through the audited server actions.
export default async function AccessRequestsPage() {
  const admin = await getAdminContext();
  const role: AdminRole = admin.isAdmin ? "Admin" : "Reviewer";

  const c = getAccessContainer();
  const [requests, allowlist] = await Promise.all([c.requests.list(), c.allowlist.list()]);
  const byId = new Map(allowlist.map((e) => [e.id, e]));
  const sorted = sortRequestsForQueue(requests);

  const rows: RequestRow[] = sorted.map((r) => {
    const e = r.allowlistId ? byId.get(r.allowlistId) : undefined;
    return {
      requestId: r.id,
      allowlistId: r.allowlistId,
      name: r.payload.fullName || e?.fullName || r.emailSubmitted,
      email: r.emailSubmitted,
      company: r.payload.company || e?.company || null,
      designation: r.payload.designation || e?.designation || null,
      location: [r.payload.city || e?.city, r.payload.state || e?.state].filter(Boolean).join(", ") || null,
      badge: conclaveBadge({
        sourceAprContact: e?.sourceAprContact ?? false,
        sourceJulRegistration: e?.sourceJulRegistration ?? false,
      }),
      psLinked: !!e?.productivityShastraId,
      status: e?.status ?? "requested",
      decision: r.decision,
      requestedAt: r.requestedAt,
      hasResume: !!r.resumePath,
      payload: r.payload,
      adminNotes: e?.adminNotes ?? null,
      sourceDate: e?.createdAt ?? r.requestedAt,
      decidedAt: r.decidedAt,
      rejectionReason: r.rejectionReason,
      whatsappHref: whatsappLink(r.payload.whatsappE164 || e?.whatsappE164 || null, "Hello from Altus Tribe"),
      phone: r.payload.phoneE164 || e?.phoneE164 || null,
      linkedin: r.payload.linkedinUrl || null,
    };
  });

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 sm:px-10">
      <header className="mb-6">
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-ink">Access requests</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Review and decide on membership requests from allowlisted Conclave participants.
          {role === "Reviewer" && " You can review and recommend, but only Admins can approve or reject."}
        </p>
      </header>
      <RequestQueue rows={rows} role={role} />
    </div>
  );
}
