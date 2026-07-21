import Link from 'next/link';

// Premium dark-glass card for every auth screen.
// Sits over the WebGL noise shader (AuthBackground).
export default function AuthShell({
  kicker,
  title,
  subtitle,
  children,
  footer,
  showClose = false,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showClose?: boolean;
}) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '440px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        width: '100%',
        background: '#ffffff',
        border: '1px solid #e1e3e4',
        borderRadius: '8px',
        padding: '48px 40px',
        boxShadow: '0 24px 64px -12px rgba(0,0,0,0.1), 0 12px 24px -8px rgba(183,16,42,0.06)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Logo — hero mark with enhanced 4k realistic shadow */}
        <header style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {showClose && (
            <Link href="/login" aria-label="Close" style={{ position: 'absolute', top: '16px', right: '16px', color: '#9a9a9a', fontSize: '20px', lineHeight: 1, textDecoration: 'none' }}>✕</Link>
          )}
          <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img
              src="/logo-dark.png"
              alt="Altus Corp"
              style={{
                height: '88px',
                width: 'auto',
                display: 'block',
                filter: 'drop-shadow(0 12px 24px rgba(183,16,42,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,0.15)) contrast(1.05)',
                transform: 'translateZ(0)',
                willChange: 'filter, transform',
              }}
            />
            <span style={{
              fontFamily: 'var(--font-geist-mono, monospace)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: '#111111',
              marginRight: '-0.35em',
            }}>
              Tribe
            </span>
          </Link>
        </header>

        <section style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9a9a9a', marginBottom: '12px' }}>
            {kicker}
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#111111', marginBottom: subtitle ? '12px' : 0 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#5f5f5f' }}>
              {subtitle}
            </p>
          )}
        </section>

        <div style={{ width: '100%' }}>
          {children}
        </div>

        {/* Footer (Request Membership, etc.) */}
        {footer && (
          <div style={{ width: '100%', marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #f0f0f0' }}>
            {footer}
          </div>
        )}
      </div>

      {/* Verified Community badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#b7102a', flexShrink: 0,
          animation: 'pulse-dot 2s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontSize: '11px', fontWeight: 600,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: '#5f5f5f',
        }}>
          Verified Community
        </span>
      </div>

      <style>{`@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  );
}

export const fieldClass =
  'w-full h-12 px-4 bg-[#fcfdfc] border border-[#e1e3e4] rounded-[4px] text-[14px] text-[#111111] placeholder:text-[#9a9a9a] outline-none transition-all duration-200 focus:border-[#111111] focus:bg-white';

export const labelClass =
  'mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#5f5f5f]';
