"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { NotificationPrefs } from "@/lib/notifications";

// Notification server actions (docs/11). Persist prefs, mark read, register push.
// All no-op safely when Supabase is unconfigured/unmigrated.

export async function markAllRead(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  revalidatePath("/notifications");
  return { ok: true };
}

export async function savePrefs(prefs: NotificationPrefs): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase.from("notification_prefs").upsert({
    profile_id: user.id,
    announcements: prefs.announcements,
    messages: prefs.messages,
    mentions: prefs.mentions,
    monthly_digest: prefs.monthlyDigest,
  });

  revalidatePath("/settings/notifications");
  return { ok: true };
}

// Register a Web Push subscription for this device (#155). Endpoint is unique,
// so re-registering the same device is idempotent.
export async function registerPush(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase.from("push_subscriptions").upsert(
    {
      profile_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: "endpoint" },
  );
  return { ok: true };
}
