import Link from 'next/link';
import AuthShell from '../AuthShell';
import LoginForm from './LoginForm';
import ResendConfirmation from '../ResendConfirmation';
import OAuthButtons from '../OAuthButtons';

export const metadata = {
  title: 'Sign In — Altus Tribe',
  description: 'Access your Altus Tribe account.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; check_email?: string; email?: string; error?: string }>;
}) {
  const { redirect, check_email, email, error } = await searchParams;

  return (
    <AuthShell
      kicker=""
      title="Welcome to the TRIBE."
      subtitle="Enter your credentials to access the ecosystem of Indian entrepreneurs."
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <p style={{ fontSize: '11px', color: '#9a9a9a', whiteSpace: 'nowrap' }}>
            New to the community?
          </p>
          <Link
            href="/signup"
            className="flex h-8 items-center justify-center rounded-[2px] border border-[#111111] bg-white px-3 text-xs font-semibold text-[#111111] no-underline transition-colors duration-200 hover:bg-[#111111] hover:text-white"
          >
            Request Membership
          </Link>
        </div>
      }
    >
      {check_email && <ResendConfirmation email={email} />}
      {error === 'oauth' ? (
        <p style={{ marginBottom: '16px', fontSize: '13px', color: '#c8102e' }}>
          Social sign-in didn&apos;t complete. Please try again or use your email.
        </p>
      ) : error ? (
        <p style={{ marginBottom: '16px', fontSize: '13px', color: '#c8102e' }}>
          {error === 'no-code-or-token'
            ? 'Sign-in link is invalid or expired. Please try again.'
            : error}
        </p>
      ) : null}
      <OAuthButtons />
      <LoginForm redirectTo={redirect ?? '/home'} />
    </AuthShell>
  );
}
