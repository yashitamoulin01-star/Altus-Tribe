"use server";

import { getUser as getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The 8/13-screen wizard autosaves through saveProfile (account/edit/actions);
// this action only marks completion and routes into the app.

// Marks onboarding complete and sends the member into the Home dashboard. (A
// pending/invite-gated member is bounced to /pending by the middleware.)
export async function finishOnboarding(): Promise<void> {
  const supabase = await createClient();
  if (supabase) {
    const user = await getSessionUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq("id", user.id);
    }
  }
  redirect("/home");
}
