import Link from 'next/link';

// Premium dark-glass card for every auth screen.
// Sits over the WebGL noise shader (AuthBackground).
export default function AuthShell({
  // `kicker` is still part of the API (all auth pages pass it) but the compact
  // card design no longer renders a kicker line — accepted and intentionally
  // unused rather than churning every caller.
  title,
  subtitle,
  children,
  footer,
  showClose = false,
}: {
  kicker?: string;
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
        padding: '20px 24px',
        boxShadow: '0 24px 64px -12px rgba(0,0,0,0.1), 0 12px 24px -8px rgba(183,16,42,0.06)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Logo — hero mark with enhanced 4k realistic shadow */}
        <header style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {showClose && (
            <Link href="/login" aria-label="Close" style={{ position: 'absolute', top: '16px', right: '16px', color: '#9a9a9a', fontSize: '20px', lineHeight: 1, textDecoration: 'none' }}>✕</Link>
          )}
          <Link href="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            <img
              src="/logo-dark.png"
              alt="Altus Corp"
              style={{
                height: '58px',
                width: 'auto',
                display: 'block',
                filter: 'drop-shadow(0 12px 24px rgba(183,16,42,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,0.15)) contrast(1.05)',
                transform: 'translateZ(0)',
                willChange: 'filter, transform',
              }}
            />
          </Link>
        </header>

        <section style={{ marginBottom: '8px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#111111', marginBottom: subtitle ? '6px' : 0 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#5f5f5f' }}>
              {subtitle}
            </p>
          )}
        </section>

        <div style={{ width: '100%' }}>
          {children}
        </div>

        {/* Footer (Request Membership, etc.) */}
        {footer && (
          <div style={{ width: '100%', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
            {footer}
          </div>
        )}
      </div>

      {/* Verified Community badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
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
  'w-full h-10 px-4 bg-[#fcfdfc] border border-[#e1e3e4] rounded-[4px] text-[13px] text-[#111111] placeholder:text-[#9a9a9a] outline-none transition-all duration-200 focus:border-[#111111] focus:bg-white';

export const labelClass =
  'mb-1 block text-[9px] font-semibold uppercase tracking-[0.12em] text-[#5f5f5f]';
