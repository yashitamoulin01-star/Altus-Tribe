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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
            New to the community?
          </p>
          <Link
            href="/signup"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '44px',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              textDecoration: 'none',
              transition: 'background 180ms ease, border-color 180ms ease',
              backdropFilter: 'blur(8px)',
            }}
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
