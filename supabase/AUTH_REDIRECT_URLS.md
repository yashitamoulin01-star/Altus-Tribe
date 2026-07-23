# Supabase Auth — URL Configuration (add these manually)

Dashboard → **Authentication → URL Configuration**.

The app sends **every** email link (signup confirm, magic link, email change, and
password reset) through **`/auth/callback`**:
- Magic link / confirm →  `{origin}/auth/callback`
- Password reset       →  `{origin}/auth/callback?next=/reset-password`

`{origin}` is resolved at runtime from the request host, so it is the exact domain
the user is on (production Vercel domain, or localhost in dev).

## 1) Site URL
```
https://altus-tribe01.vercel.app
```
(Use your primary production domain. If you add a custom domain later, change this
to it.)

## 2) Redirect URLs (allow list) — add ALL of these
```
https://altus-tribe01.vercel.app/auth/callback
https://altus-tribe01.vercel.app/**
http://localhost:3000/auth/callback
http://localhost:3000/**
```
- The `/**` wildcard covers the `?next=/reset-password` variant and any deep-link
  `next` target.
- If Vercel gives you preview URLs you also test on, add
  `https://*-<your-team>.vercel.app/**` (optional).
- If you attach a custom domain, add `https://yourdomain.com/auth/callback` and
  `https://yourdomain.com/**` too.

## 3) (Optional but recommended) Vercel env
Set `NEXT_PUBLIC_SITE_URL=https://altus-tribe01.vercel.app` in Vercel → Project →
Settings → Environment Variables. It's only a fallback (runtime host is preferred),
but it keeps links correct if a request arrives without a host header.

After saving, test: Forgot password → email → link should open
`/auth/callback?next=/reset-password` and land you on the reset form, signed in.
