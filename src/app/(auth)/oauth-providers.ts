// Supported social providers (Supabase provider ids). LinkedIn uses the OIDC
// integration. Kept out of actions.ts because a "use server" file may only
// export async functions.
export const OAUTH_PROVIDERS = ["google", "linkedin_oidc", "apple"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
