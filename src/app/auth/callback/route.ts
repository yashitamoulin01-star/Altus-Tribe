import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Handles email-confirmation and password-recovery links. Supports both the
// PKCE `code` exchange and the `token_hash` + `type` OTP verification flows.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/account";

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(`${origin}/login`);

  let authError = "no-code-or-token";

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    authError = error.message;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      const dest = type === "recovery" ? "/reset-password" : next;
      return NextResponse.redirect(`${origin}${dest}`);
    }
    authError = error.message;
  }

  // Fallback redirect with the exact error or 'no-code-or-token' if neither was present
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(authError)}`);
}
