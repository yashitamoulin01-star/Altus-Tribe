"use server";

import { getUser as getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { badId } from "@/lib/validation/actions";

// Record a profile view (Phase 5.2). Upsert on (viewer, owner): the FIRST view
// inserts a row and the profile_views_notify trigger notifies the owner; later
// views just refresh viewed_at (an UPDATE — no trigger, no repeat notification).
// No-ops for signed-out users, self-views, and offline.
export async function recordProfileView(ownerId: string): Promise<void> {
  if (badId(ownerId)) return;
  const supabase = await createClient();
  if (!supabase) return;
  const user = await getSessionUser();
  if (!user || user.id === ownerId) return;

  await supabase.from("profile_views").upsert(
    { viewer_id: user.id, owner_id: ownerId, viewed_at: new Date().toISOString() },
    { onConflict: "viewer_id,owner_id" },
  );
}
