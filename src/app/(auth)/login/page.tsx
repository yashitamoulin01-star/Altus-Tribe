import Link from 'next/link';
import { redirect as goTo } from 'next/navigation';
import { getUser } from '@/lib/auth';
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
  searchParams: Promise<{ redirect?: string; check_email?: string; email?: string; error?: string; reset_success?: string }>;
}) {
  const { redirect, check_email, email, error, reset_success } = await searchParams;

  // Already signed in (e.g. reached /login via the browser back button)? Send
  // them into the app instead of showing the login form. Login UI unchanged.
  if (await getUser()) {
    goTo(redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/home');
  }

  return (
    <AuthShell
      kicker=""
      title="Welcome to the TRIBE."
      subtitle="Access the ecosystem of Indian entrepreneurs."
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
      {reset_success ? (
        <p style={{ marginBottom: '16px', fontSize: '13px', color: '#059669', backgroundColor: '#ecfdf5', padding: '10px 14px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
          Password updated successfully! Please sign in with your new password.
        </p>
      ) : null}
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
