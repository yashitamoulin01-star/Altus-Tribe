import Link from "next/link";
import { getUser, isAuthConfigured } from "@/lib/auth";
import { getAdminContext } from "@/lib/admin";
import { signOut } from "../../(auth)/actions";

// Protected landing after sign-in. Middleware redirects unauthenticated users
// to /login; this page also degrades gracefully when auth isn't configured.
export default async function AccountPage() {
  const configured = isAuthConfigured();
  const user = await getUser();
  const admin = await getAdminContext();

  const email = user?.email ?? "";
  const menu = [
    ...(admin.canAccess
      ? [{ href: "/admin" as const, label: "Admin panel", hint: "Roster, consultants, import, exports, private CRM." }]
      : []),
    { href: "/settings" as const, label: "Settings", hint: "Appearance, notifications, and preferences." },
    { href: "/settings/security" as const, label: "Security", hint: "Password, two-factor, and sessions." },
    { href: "/refer" as const, label: "Refer someone", hint: "Invite a productive peer into the Tribe." },
  ];

  return (
    <main className="mx-auto w-full max-w-[900px] px-6 pt-6 pb-16 sm:px-10">
      {/* Back */}
      <Link
        href="/home"
        className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface px-4 py-2 text-[13px] font-semibold text-ink shadow-sm transition-colors hover:border-hairline-bright"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back
      </Link>

      <header className="mt-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-3xl">Account</h1>
        <p className="mt-2 text-[15px] text-ink-secondary">Manage your profile, preferences, and application data.</p>
      </header>

      {!configured ? (
        <div className="mt-8 rounded-2xl border border-hairline bg-surface-sunk px-5 py-4 text-[14px] leading-relaxed text-ink-secondary">
          Supabase auth isn&apos;t configured in this environment, so this is a preview. Add{" "}
          <code className="text-ink">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-ink">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
          <code className="text-ink">.env.local</code> to enable real sign-in.
        </div>
      ) : !user ? (
        <p className="mt-8 text-[16px] text-ink-secondary">
          You&apos;re not signed in.{" "}
          <Link href="/login" className="text-red hover:text-red-hover">Sign in →</Link>
        </p>
      ) : (
        <>
          {/* Profile card */}
          <section className="mt-8 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-md">
            <div className="p-6 sm:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-[17px] font-semibold text-ink">Profile</h2>
                  <p className="mt-0.5 text-[13px] text-ink-muted">Your account details</p>
                </div>
                <Link
                  href="/account/edit"
                  className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface px-4 py-2 text-[13px] font-semibold text-ink shadow-sm transition-colors hover:border-red/40 hover:text-red"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
                  Edit
                </Link>
              </div>

              {/* Identity */}
              <div className="mt-6 flex items-center gap-4">
                <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red to-red-hover text-[20px] font-bold text-white shadow-sm">
                  {(email || "?").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[18px] font-semibold text-ink">{email.split("@")[0] || "Participant"}</p>
                  <p className="text-[13px] text-ink-muted">{admin.isAdmin ? "Admin" : "Participant"}</p>
                  <Link href="/account/edit" className="mt-1 inline-block text-[12px] font-semibold text-red hover:text-red-hover">Upload photo</Link>
                </div>
              </div>

              {/* Field rows */}
              <dl className="mt-7 grid gap-4 sm:grid-cols-2">
                <FieldRow
                  label="Email"
                  value={email}
                  icon='<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>'
                />
                <FieldRow
                  label="User ID"
                  value={user.id}
                  mono
                  icon='<circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3.5-7 7-7s7 3 7 7"/>'
                />
              </dl>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-red to-red-hover" />
          </section>

          {/* Quick links */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
            <ul className="divide-y divide-hairline">
              {menu.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-surface-sunk">
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-ink transition-colors group-hover:text-red">{item.label}</span>
                      <span className="mt-0.5 block truncate text-[13px] text-ink-muted">{item.hint}</span>
                    </span>
                    <svg className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-red" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-6">
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-hairline px-5 py-2.5 text-[14px] font-medium text-ink-secondary transition-colors hover:border-red/40 hover:text-red"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </main>
  );
}

// Icon field row — grey rounded-square icon chip + small muted label + value.
function FieldRow({ label, value, icon, mono = false }: { label: string; value: string; icon: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-sunk text-ink-muted"
        dangerouslySetInnerHTML={{
          __html: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`,
        }}
      />
      <div className="min-w-0">
        <dt className="text-[12px] font-medium text-ink-muted">{label}</dt>
        <dd className={`truncate text-[15px] font-semibold text-ink ${mono ? "font-mono text-[12px]" : ""}`}>{value}</dd>
      </div>
    </div>
  );
}
