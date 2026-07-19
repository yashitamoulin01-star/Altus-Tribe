import Link from 'next/link';

// Premium card shell for every auth screen.
// Sits on top of AuthBackground (MagicRings + CursorGrid).
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
    <div className="w-full max-w-[420px] flex flex-col items-center">
      {/* Card */}
      <div
        className="w-full"
        style={{
          background: '#ffffff',
          borderRadius: '2px',
          boxShadow:
            '0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        <div className="px-7 py-5">
          {/* Logo header */}
          <header className="mb-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <div
                className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                style={{ background: '#c8102e' }}
              >
                <svg width="14" height="12" viewBox="0 0 16 14" fill="none" aria-hidden>
                  <path d="M8 1L15 13H1L8 1Z" fill="white" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: '#111111',
                }}
              >
                Altus Tribe
              </span>
            </Link>
            {showClose && (
              <Link
                href="/login"
                aria-label="Close"
                style={{ color: '#9a9a9a', fontSize: '18px', lineHeight: 1 }}
              >
                ✕
              </Link>
            )}
          </header>

          {/* Title block */}
          <section className="mb-4">
            <p className="kicker mb-1.5">{kicker}</p>
            <h1
              style={{
                fontSize: '21px',
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: '#111111',
                marginBottom: subtitle ? '5px' : 0,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: '#5f5f5f',
                  maxWidth: '300px',
                }}
              >
                {subtitle}
              </p>
            )}
          </section>

          {/* Form content */}
          <div>{children}</div>

          {/* Footer */}
          {footer && (
            <div
              style={{
                marginTop: '14px',
                paddingTop: '14px',
                borderTop: '1px solid #e4e4e2',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* Verified badge — sits below the card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          marginTop: '14px',
        }}
      >
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: '#c8102e',
            flexShrink: 0,
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#9a9a9a',
          }}
        >
          Verified Community
        </span>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}

// Shared field + label styles for auth forms
export const fieldClass =
  'w-full h-10 px-3.5 border border-[#e4e4e2] rounded-[2px] text-[14px] text-[#111111] placeholder:text-[#9a9a9a] bg-white outline-none transition-[border-color] duration-150 focus:border-[#111111]';

export const labelClass =
  'mb-1 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9a9a9a]';
