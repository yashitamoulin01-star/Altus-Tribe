import Link from "next/link";
import { getUser, isAuthConfigured } from "@/lib/auth";
import { getAdminContext } from "@/lib/admin";
import SignOutButton from "@/components/SignOutButton";

// Protected landing after sign-in. Middleware redirects unauthenticated users
// to /login; this page also degrades gracefully when auth isn't configured.
export default async function AccountPage() {
  const configured = isAuthConfigured();
  const user = await getUser();
  const admin = await getAdminContext();

  return (
    <main className="mx-auto w-full max-w-[640px] flex-1 px-6 py-16 sm:px-10">
      <nav className="mb-10">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
        >
          ← Altus Tribe
        </Link>
      </nav>

      <p className="kicker mb-4">Your account</p>
      <h1 className="text-3xl font-semibold tracking-[-0.015em] text-ink">
        {user ? "You're in." : "Sign-in preview"}
      </h1>

      {!configured ? (
        <p className="mt-5 rounded border border-hairline bg-surface-sunk px-4 py-3 text-[15px] leading-relaxed text-ink-secondary">
          Supabase auth isn&apos;t configured in this environment, so this is a
          preview. Add <code className="text-ink">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and <code className="text-ink">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
          <code className="text-ink">.env.local</code> to enable real sign-in.
        </p>
      ) : user ? (
        <>
          <dl className="mt-6 space-y-4 border-t border-hairline pt-6">
            <div className="grid grid-cols-[112px_1fr] gap-4">
              <dt className="kicker">Email</dt>
              <dd className="text-[16px] text-ink">{user.email}</dd>
            </div>
            <div className="grid grid-cols-[112px_1fr] gap-4">
              <dt className="kicker">User ID</dt>
              <dd className="break-all font-mono text-[13px] text-ink-secondary">
                {user.id}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/account/edit"
              className="rounded bg-red px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover"
            >
              Edit my feature
            </Link>
            <SignOutButton className="rounded border border-hairline px-5 py-2.5 text-[15px] text-ink transition-colors hover:border-ink-muted" />
          </div>

          {/* Menu items (#134, #135) */}
          <nav className="mt-10 divide-y divide-hairline border-t border-hairline">
            {[
              ...(admin.canAccess
                ? [
                    {
                      href: "/admin" as const,
                      label: "Admin panel",
                      hint: "Roster, consultants, import, exports, private CRM.",
                    },
                  ]
                : []),
              {
                href: "/refer" as const,
                label: "Refer Someone",
                hint: "Invite a productive peer into the Tribe.",
              },
              {
                href: "/settings/notifications" as const,
                label: "Notification Settings",
                hint: "Choose what reaches you.",
              },
              {
                href: "/settings/security" as const,
                label: "Security & 2FA",
                hint: "Add two-factor authentication to your account.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between gap-4 py-4 transition-colors"
              >
                <span>
                  <span className="block text-[16px] text-ink transition-colors group-hover:text-red">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[14px] text-ink-muted">
                    {item.hint}
                  </span>
                </span>
                <span className="font-mono text-ink-muted transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            ))}
          </nav>
        </>
      ) : (
        <p className="mt-5 text-[16px] text-ink-secondary">
          You&apos;re not signed in.{" "}
          <Link href="/login" className="text-red hover:text-red-hover">
            Sign in →
          </Link>
        </p>
      )}
    </main>
  );
}
