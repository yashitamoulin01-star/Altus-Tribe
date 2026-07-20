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
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Logo — hero mark with red glow */}
      <header style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '100%' }}>
        {showClose && (
          <Link href="/login" aria-label="Close" style={{ position: 'absolute', top: 0, right: 0, color: 'rgba(255,255,255,0.45)', fontSize: '20px', lineHeight: 1 }}>✕</Link>
        )}
        <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img
            src="/logo-dark.png"
            alt="Altus Corp"
            style={{
              height: '80px',
              width: 'auto',
              display: 'block',
              filter: 'drop-shadow(0 4px 12px rgba(183,16,42,0.4))',
            }}
          />
          <span style={{
            fontFamily: 'var(--font-geist-mono, monospace)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: '#111111',
          }}>
            Tribe
          </span>
        </Link>
      </header>

      <section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5f5f5f', marginBottom: '8px' }}>
          {kicker}
        </p>
        <h1 style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#111111', marginBottom: subtitle ? '8px' : 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#5f5f5f', maxWidth: '280px', margin: '0 auto' }}>
            {subtitle}
          </p>
        )}
      </section>

      <div style={{
        width: '100%',
        background: '#ffffff',
        border: '1px solid #e1e3e4',
        borderRadius: '4px',
        padding: '28px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      }}>
        {children}
      </div>

      {/* Footer (Request Membership, etc.) */}
      {footer && (
        <div style={{ width: '100%', marginTop: '16px' }}>
          {footer}
        </div>
      )}

      {/* Verified Community badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#b7102a', flexShrink: 0,
          animation: 'pulse-dot 2s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: '#9a9a9a',
        }}>
          Verified Community
        </span>
      </div>

      <style>{`@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  );
}

export const fieldClass =
  'w-full h-12 px-4 bg-[#fcfdfc] border border-[#e1e3e4] rounded-[2px] text-[14px] text-[#111111] placeholder:text-[#9a9a9a] outline-none transition-all duration-200 focus:border-[#111111] focus:bg-white';

export const labelClass =
  'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5f5f5f]';
