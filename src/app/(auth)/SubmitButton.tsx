'use client';

// Full-width red primary button that reflects the form's pending state.
export default function SubmitButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: '100%',
        height: '40px',
        background: pending ? '#a50d26' : '#c8102e',
        color: '#ffffff',
        border: 'none',
        borderRadius: '2px',
        fontSize: '15px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        cursor: pending ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '2px',
        transition: 'background 150ms ease, transform 100ms ease',
        opacity: pending ? 0.85 : 1,
      }}
      onMouseEnter={e => {
        if (!pending) (e.currentTarget as HTMLButtonElement).style.background = '#a50d26';
      }}
      onMouseLeave={e => {
        if (!pending) (e.currentTarget as HTMLButtonElement).style.background = '#c8102e';
      }}
      onMouseDown={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.985)';
      }}
      onMouseUp={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      {pending ? (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ animation: 'spin-btn 0.8s linear infinite' }}
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          Entering…
        </>
      ) : (
        <>
          {children}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </>
      )}
      <style>{`
        @keyframes spin-btn {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
