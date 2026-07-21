"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import { badId } from "@/lib/validation/actions";

// Campus activity actions (Phase 5.3). Upsert the caller's own resource_activity
// row; RLS scopes writes to the owner. No-op offline.

async function setFlag(
  resourceId: string,
  patch: { bookmarked?: boolean; completed?: boolean },
): Promise<{ ok: boolean }> {
  if (badId(resourceId)) return { ok: false };
  const supabase = await createClient();
  if (!supabase) return { ok: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("resource_activity").upsert(
    { profile_id: user.id, resource_id: resourceId, ...patch },
    { onConflict: "profile_id,resource_id" },
  );
  if (error) {
    logError("setResourceActivity", error, { userId: user.id });
    return { ok: false };
  }
  revalidatePath("/campus");
  revalidatePath(`/campus/${resourceId}`);
  return { ok: true };
}

export async function setBookmark(resourceId: string, bookmarked: boolean) {
  return setFlag(resourceId, { bookmarked });
}

export async function setCompleted(resourceId: string, completed: boolean) {
  return setFlag(resourceId, { completed });
}
