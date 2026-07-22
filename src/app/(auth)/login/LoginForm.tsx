'use client';

import { useActionState, useState, useTransition } from 'react';
import { login, sendMagicLink, type AuthState } from '../actions';
import SubmitButton from '../SubmitButton';
import { fieldClass, labelClass } from '../AuthShell';
import CaptchaField from '@/components/CaptchaField';
import LegalModal, { type LegalDocType } from '@/components/LegalModal';

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [magicPending, startMagic] = useTransition();
  const [magic, setMagic] = useState<{ sent?: boolean; error?: string }>({});

  const onMagicLink = () =>
    startMagic(async () => {
      setMagic({});
      const res = await sendMagicLink(email, captchaToken);
      if (res.ok) setMagic({ sent: true });
      else setMagic({ error: res.error ?? res.fieldError ?? 'Could not send link.' });
    });

  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);

  return (
    <>
      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="redirect" value={redirectTo} />

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="email"
            className={labelClass}
            style={{ color: focusedField === 'email' ? '#c8102e' : undefined }}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            className={fieldClass}
            style={{
              borderColor: focusedField === 'email' ? '#111111' : undefined,
            }}
          />
          {state?.fieldErrors?.email && (
            <p style={{ fontSize: '12px', color: '#c8102e' }}>{state.fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="password"
            className={labelClass}
            style={{ color: focusedField === 'password' ? '#c8102e' : undefined }}
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
                borderColor: focusedField === 'password' ? '#111111' : undefined,
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
                color: '#9a9a9a',
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
          {state?.fieldErrors?.password && (
            <p style={{ fontSize: '12px', color: '#c8102e' }}>{state.fieldErrors.password}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1px' }}>
            <a
              href="/forgot-password"
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#5f5f5f',
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c8102e')}
              onMouseLeave={e => (e.currentTarget.style.color = '#5f5f5f')}
            >
              Forgot Password?
            </a>
          </div>
        </div>

        {/* Admin login toggle (two-person security). When ticked, only an
            approved admin account is allowed in; anyone else is rejected. */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#5f5f5f',
            cursor: 'pointer',
            marginTop: '2px',
          }}
        >
          <input
            type="checkbox"
            name="mode"
            value="admin"
            style={{ width: '14px', height: '14px', accentColor: '#c8102e', cursor: 'pointer' }}
          />
          Log in as administrator
        </label>

        {/* Error */}
        {state?.error && (
          <p style={{ fontSize: '13px', color: '#c8102e' }}>{state.error}</p>
        )}

        <CaptchaField onToken={setCaptchaToken} />

        {/* Submit */}
        <SubmitButton pending={pending}>Enter Sacred Space</SubmitButton>

        {/* Passwordless alternative */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
          {magic.sent ? (
            <p style={{ fontSize: '13px', color: '#111111' }}>
              Sign-in link sent — check your email.
            </p>
          ) : email.length > 0 ? (
            <button
              type="button"
              onClick={onMagicLink}
              disabled={magicPending}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#5f5f5f',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: magicPending ? 'default' : 'pointer',
              }}
            >
              {magicPending ? 'Sending…' : 'Email me a sign-in link instead'}
            </button>
          ) : null}
          {magic.error && (
            <p style={{ fontSize: '12px', color: '#c8102e', textAlign: 'center', lineHeight: 1.5 }}>
              {magic.error.includes('register first') ? (
                <>
                  Account not found. Magic links are not for new users —{' '}
                  <a href="/signup" style={{ color: '#c8102e', fontWeight: 600 }}>please register first</a>.
                </>
              ) : magic.error}
            </p>
          )}
        </div>

        {/* Legal Disclaimer */}
        <p className="mt-2 text-center text-[10px] leading-tight text-[#9a9a9a]">
          By signing in, you agree to our{' '}
          <button
            type="button"
            onClick={() => setLegalDoc('terms')}
            className="underline transition-colors hover:text-[#111111]"
          >
            Terms & Conditions
          </button>
          ,{' '}
          <button
            type="button"
            onClick={() => setLegalDoc('privacy')}
            className="underline transition-colors hover:text-[#111111]"
          >
            Privacy Policy
          </button>
          , and{' '}
          <button
            type="button"
            onClick={() => setLegalDoc('guidelines')}
            className="underline transition-colors hover:text-[#111111]"
          >
            Community Guidelines
          </button>
          .
        </p>
      </form>
      <LegalModal type={legalDoc} onClose={() => setLegalDoc(null)} />
    </>
  );
}
