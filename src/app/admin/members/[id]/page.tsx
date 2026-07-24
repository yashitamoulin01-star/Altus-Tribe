import Link from "next/link";
import { notFound } from "next/navigation";
import { getRosterMember, getConsultants, getAdminContext } from "@/lib/admin";
import { getCrm } from "@/lib/crm";
import CrmEditor from "./CrmEditor";
import RoleControl from "./RoleControl";
import ShareComposer from "./ShareComposer";

export default async function AdminMemberDetailPage({
  params,
}: PageProps<"/admin/members/[id]">) {
  const { id } = await params;
  const [member, crm, consultants, ctx] = await Promise.all([
    getRosterMember(id),
    getCrm(id),
    getConsultants(),
    getAdminContext(),
  ]);
  if (!member) notFound();

  return (
    <main className="mx-auto w-full max-w-[900px] px-6 py-8 sm:px-10">
      <nav className="mb-6">
        <Link
          href="/admin/members"
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
        >
          ← Roster
        </Link>
      </nav>

      {/* Identity summary */}
      <header className="flex items-center justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
            {member.fullName}
          </h1>
          <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-muted">
            {[member.role, member.status, member.city, member.industry]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/m/${member.slug}`}
            className="rounded border border-hairline px-4 py-2 text-[13px] text-ink transition-colors hover:border-ink-muted"
          >
            View feature
          </Link>
          <Link
            href={`/admin/members/${member.id}/edit`}
            className="rounded border border-hairline px-4 py-2 text-[13px] text-ink transition-colors hover:border-ink-muted"
          >
            Edit profile
          </Link>
        </div>
      </header>

      {/* Role / administrator access (admins only) */}
      {ctx.isAdmin && member.id !== ctx.userId && (
        <section className="flex items-center justify-between gap-4 border-b border-hairline py-6">
          <div>
            <p className="kicker mb-1">Administrator access</p>
            <p className="text-[14px] text-ink-secondary">
              {member.role === "admin"
                ? "This member has full administrator access."
                : "Grant this member access to the admin portal."}
            </p>
          </div>
          <RoleControl id={member.id} role={member.role} />
        </section>
      )}

      {/* Private CRM */}
      <section className="pt-8">
        <div className="mb-5 flex items-center gap-3">
          <p className="kicker">Private CRM</p>
          <span className="rounded bg-red/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-red">
            Never shown to members
          </span>
        </div>
        <CrmEditor
          record={crm.record}
          assets={crm.assets}
          consultants={consultants}
          isAdmin={ctx.isAdmin}
        />
      </section>

      {/* A1–A22 sharing (admins only) */}
      {ctx.isAdmin && (
        <section className="mt-10 border-t border-hairline pt-8">
          <div className="mb-4 flex items-center gap-3">
            <p className="kicker">Share intelligence</p>
            <span className="rounded bg-surface-sunk px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
              Audited
            </span>
          </div>
          <ShareComposer
            participantId={member.id}
            memberName={member.fullName}
            record={crm.record}
            assets={crm.assets}
          />
        </section>
      )}
    </main>
  );
}
