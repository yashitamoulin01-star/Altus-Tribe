"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { logError } from "@/lib/logger";
import type { NotificationPrefs } from "@/lib/notifications";

// Notification server actions (docs/11). Persist prefs, mark read, register push.
// All no-op safely when Supabase is unconfigured/unmigrated.

export async function markAllRead(): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;
  const user = await getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  if (error) logError("markAllRead", error, { userId: user.id });

  revalidatePath("/notifications");
}

export async function markRead(id: string): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;
  const user = await getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", user.id)
    .is("read_at", null);
  if (error) logError("markRead", error, { userId: user.id });

  revalidatePath("/notifications");
}

export async function savePrefs(prefs: NotificationPrefs): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false };
  const user = await getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("notification_prefs").upsert({
    profile_id: user.id,
    announcements: prefs.announcements,
    messages: prefs.messages,
    mentions: prefs.mentions,
    monthly_digest: prefs.monthlyDigest,
  });
  if (error) {
    logError("savePrefs", error, { userId: user.id });
    return { ok: false };
  }

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
  const user = await getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      profile_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) {
    logError("registerPush", error, { userId: user.id });
    return { ok: false };
  }
  return { ok: true };
}

// Remove this device's Web Push subscription (opt-out / unsubscribe). RLS scopes
// the delete to the caller's own rows, so the endpoint match is enough.
export async function unregisterPush(endpoint: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false };
  const user = await getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("profile_id", user.id);
  if (error) {
    logError("unregisterPush", error, { userId: user.id });
    return { ok: false };
  }
  return { ok: true };
}
