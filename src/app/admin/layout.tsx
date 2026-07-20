import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin";
import AdminNav from "./AdminNav";

export const metadata = { title: "Admin — Altus Tribe" };

// Admin shell. Middleware already requires a session for /admin; here we
// additionally enforce role (admin/consultant). Offline preview stays open with
// a banner so the demo works without a live DB.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdminContext();
  if (ctx.configured && !ctx.canAccess) redirect("/home");

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 border-b border-hairline bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6 sm:px-10">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-baseline gap-2 no-underline">
              <span className="text-[15px] font-bold tracking-[-0.02em] text-ink">
                ALTUS
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-red">
                Admin
              </span>
            </Link>
            {ctx.role && (
              <span className="rounded bg-surface-sunk px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                {ctx.role}
              </span>
            )}
          </div>
          <Link
            href="/home"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
          >
            ← Back to app
          </Link>
        </div>
        <AdminNav />
      </header>

      {!ctx.configured && (
        <div className="mx-auto max-w-[1200px] px-6 pt-4 sm:px-10">
          <p className="rounded border border-hairline bg-surface-sunk px-4 py-2.5 text-[13px] text-ink-muted">
            Preview mode — Supabase isn&apos;t configured, so this shows sample data
            and actions are inert. Role gating and the CRM boundary enforce via RLS
            once a live project is connected.
          </p>
        </div>
      )}

      {children}
    </div>
  );
}
