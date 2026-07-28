// Supported social providers (Supabase provider ids). LinkedIn uses the OIDC
// integration. Kept out of actions.ts because a "use server" file may only
// export async functions.
// Apple removed (owner spec 2026-07-28) until an Apple Developer account exists.
export const OAUTH_PROVIDERS = ["google", "linkedin_oidc"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
