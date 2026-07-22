import { getAdmins, getAdminContext } from "@/lib/admin";
import AdminAccessActions from "./AdminAccessActions";

export const metadata = { title: "Admins — Altus Tribe Admin" };

export default async function AdminsPage() {
  const [admins, ctx] = await Promise.all([getAdmins(), getAdminContext()]);
  const pending = admins.filter((a) => !a.approved);
  const approved = admins.filter((a) => a.approved);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Admins</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Administrator access
      </h1>
      <p className="mt-2 max-w-[640px] text-[15px] text-ink-secondary">
        Admin accounts must be approved by an existing administrator before they
        can sign in to the admin panel. Approve requests you trust; revoke access
        you no longer want.
      </p>

      {/* Pending requests */}
      <section className="mt-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Awaiting approval ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded border border-hairline px-4 py-8 text-center text-[14px] text-ink-secondary">
            No pending admin requests.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-hairline rounded border border-hairline">
            {pending.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-[15px] font-medium text-ink">{a.fullName}</span>
                <AdminAccessActions id={a.id} approved={false} isSelf={ctx.userId === a.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Approved admins */}
      <section className="mt-10">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Approved admins ({approved.length})
        </h2>
        <ul className="mt-3 divide-y divide-hairline rounded border border-hairline">
          {approved.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-[15px] font-medium text-ink">{a.fullName}</span>
              <AdminAccessActions id={a.id} approved={true} isSelf={ctx.userId === a.id} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
