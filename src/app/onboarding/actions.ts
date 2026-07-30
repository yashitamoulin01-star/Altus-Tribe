"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

// The 8/13-screen wizard autosaves through saveProfile (account/edit/actions);
// this action only marks completion and routes into the app.

// Marks onboarding complete and sends the member into the Home dashboard. (A
// pending/invite-gated member is bounced to /pending by the middleware.)
const TERMS_VERSION = "1.0";
const PRIVACY_VERSION = "1.0";

export async function finishOnboarding(consent?: { notifOptIn?: boolean }): Promise<void> {
  const supabase = await createClient();
  if (supabase) {
    const user = await getUser();
    if (user) {
      const now = new Date().toISOString();
      await supabase
        .from("profiles")
        .update({ onboarding_completed_at: now })
        .eq("id", user.id);
      // Record consent (columns from migration 0028). Separate best-effort update
      // so a not-yet-applied migration (42703) never blocks finishing onboarding.
      const { error } = await supabase
        .from("profiles")
        .update({
          terms_accepted_at: now,
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION,
          notif_opt_in: consent?.notifOptIn ?? false,
        })
        .eq("id", user.id);
      if (error && error.code !== "42703") {
        // non-schema error — swallow; consent is non-blocking for entry
      }
    }
  }
  // A pending member is bounced to /pending by the middleware; approved → Home.
  redirect("/home");
}
