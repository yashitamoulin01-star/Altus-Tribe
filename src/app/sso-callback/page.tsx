"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

// Landing route for Clerk OAuth (Google) redirects. Clerk completes the handshake
// here and forwards on. Public route (not in the protected matcher).
export default function SSOCallbackPage() {
  return (
    <AuthenticateWithRedirectCallback
      signInFallbackRedirectUrl="/home"
      signUpFallbackRedirectUrl="/onboarding"
    />
  );
}
