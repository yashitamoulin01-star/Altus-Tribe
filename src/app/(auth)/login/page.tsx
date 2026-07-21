import Link from 'next/link';
import AuthShell from '../AuthShell';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Sign In — Altus Tribe',
  description: 'Access your Altus Tribe account.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; check_email?: string }>;
}) {
  const { redirect, check_email } = await searchParams;

  return (
    <AuthShell
      kicker="Welcome back"
      title="Welcome to the Tribe."
      subtitle="Enter your credentials to access the ecosystem of Indian entrepreneurs."
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
          <p style={{ fontSize: '12px', color: '#5f5f5f', textAlign: 'center' }}>
            New to the community?
          </p>
          <Link
            href="/signup"
            className="flex h-11 w-full items-center justify-center rounded-[2px] border border-[#111111] bg-white text-sm font-semibold text-[#111111] no-underline transition-colors duration-200 hover:bg-[#111111] hover:text-white"
          >
            Request Membership
          </Link>
        </div>
      }
    >
      {check_email && (
        <p
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            border: '1px solid #e4e4e2',
            borderRadius: '2px',
            background: '#f4f4f3',
            fontSize: '13px',
            color: '#5f5f5f',
          }}
        >
          Check your email to confirm your account, then sign in.
        </p>
      )}
      <LoginForm redirectTo={redirect ?? '/home'} />
    </AuthShell>
  );
}
