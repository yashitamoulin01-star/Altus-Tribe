'use client';

import { useActionState, useState } from 'react';
import { login, type AuthState } from '../actions';
import SubmitButton from '../SubmitButton';
import { fieldClass, labelClass } from '../AuthShell';

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <form action={action} className="flex flex-col gap-2.5">
      <input type="hidden" name="redirect" value={redirectTo} />

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="email"
          className={labelClass}
          style={{ color: focusedField === 'email' ? 'rgba(255,255,255,0.9)' : undefined }}
        >
          Business Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="name@company.com"
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          className={fieldClass}
          style={{
            borderColor: focusedField === 'email' ? 'rgba(255,255,255,0.6)' : undefined,
          }}
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="password"
          className={labelClass}
          style={{ color: focusedField === 'password' ? 'rgba(255,255,255,0.9)' : undefined }}
        >
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            className={fieldClass}
            style={{
              paddingRight: '44px',
              borderColor: focusedField === 'password' ? 'rgba(255,255,255,0.6)' : undefined,
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: 'rgba(255,255,255,0.45)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1px' }}>
          <a
            href="/forgot-password"
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            Forgot Password?
          </a>
        </div>
      </div>

      {/* Error */}
      {state?.error && (
        <p style={{ fontSize: '13px', color: '#c8102e' }}>{state.error}</p>
      )}

      {/* Submit */}
      <SubmitButton pending={pending}>Enter Sacred Space</SubmitButton>
    </form>
  );
}
