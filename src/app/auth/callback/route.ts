import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Handles email-confirmation, magic-link, and password-recovery links. Supports both the
// PKCE `code` exchange and the `token_hash` + `type` OTP verification flows.
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next");
  const errorParam = searchParams.get("error_description") || searchParams.get("error");

  // Validate next path to prevent open redirect vulnerabilities
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  // Determine site origin safely
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  let origin = requestUrl.origin;
  if (siteUrl) {
    origin = siteUrl.replace(/\/+$/, "");
  } else if (forwardedHost) {
    origin = `${forwardedProto}://${forwardedHost}`;
  }

  // If Supabase returned an error in URL query params (e.g. link expired)
  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`);
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(`${origin}/login`);

  let authError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const dest = type === "recovery" || next === "/reset-password" ? "/reset-password" : next;
      return NextResponse.redirect(`${origin}${dest}`);
    }
    authError = error.message;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      const dest = type === "recovery" || next === "/reset-password" ? "/reset-password" : next;
      return NextResponse.redirect(`${origin}${dest}`);
    }
    authError = error.message;
  }

  // Fallback for Implicit Flow / client-side hash fragments (`#access_token=...`)
  // Hash fragments are not sent to the server in HTTP GET requests.
  // Return an HTML page with inline JS to check window.location.hash before failing.
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authenticating...</title>
</head>
<body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0b0b0b; color: #fff;">
  <div style="text-align: center;">
    <p style="font-size: 16px;">Verifying sign-in link...</p>
  </div>
  <script>
    (function() {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const params = new URLSearchParams(hash.substring(1));
        const err = params.get("error_description") || params.get("error");
        const accessToken = params.get("access_token");
        const type = params.get("type");

        if (err) {
          window.location.href = "${origin}/login?error=" + encodeURIComponent(err);
          return;
        }
        if (accessToken) {
          const dest = type === "recovery" ? "/reset-password" : "${next}";
          window.location.href = "${origin}" + dest + hash;
          return;
        }
      }
      const errMessage = ${JSON.stringify(authError || "no-code-or-token")};
      window.location.href = "${origin}/login?error=" + encodeURIComponent(errMessage);
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

