import "server-only";
import { getUser as getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Notifications data layer (docs/11-spec-messaging-notifications.md). In-app
// notification center + per-member preferences. Offline-first: sample data when
// Supabase is unconfigured/unmigrated so build and pages stay green.

export type NotificationKind =
  | "message"
  | "announcement"
  | "mention"
  | "referral"
  | "system";

export interface NotificationView {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPrefs {
  announcements: boolean;
  messages: boolean;
  mentions: boolean;
  monthlyDigest: boolean;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  announcements: true,
  messages: true,
  mentions: true,
  monthlyDigest: false,
};

const schemaMissing = (e: { code?: string } | null) =>
  e?.code === "PGRST205" || e?.code === "42P01";

const SAMPLE_NOTIFICATIONS: NotificationView[] = [
  {
    id: "n1",
    kind: "message",
    title: "Arjun Nair sent you a message",
    body: "Happy to intro you to our fintech group — let's talk.",
    link: "/messages/sample-arjun",
    read: false,
    createdAt: "2026-07-19T17:40:00Z",
  },
  {
    id: "n2",
    kind: "announcement",
    title: "The next Conclave is open for registration",
    body: "Doors open for the winter Conclave. Members get priority seating.",
    link: "/sacred-space",
    read: false,
    createdAt: "2026-07-14T08:00:00Z",
  },
  {
    id: "n3",
    kind: "referral",
    title: "Priya referred you to a new member",
    body: "You were introduced in Founders in Manufacturing.",
    link: "/messages/sample-founders",
    read: true,
    createdAt: "2026-07-12T10:30:00Z",
  },
];

export async function getNotifications(): Promise<NotificationView[]> {
  const supabase = await createClient();
  if (!supabase) return SAMPLE_NOTIFICATIONS;
  const user = await getSessionUser();
  if (!user) return SAMPLE_NOTIFICATIONS;

  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, link, read_at, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (schemaMissing(error)) return SAMPLE_NOTIFICATIONS;
    return [];
  }
  return (data ?? []).map((n) => ({
    id: n.id as string,
    kind: n.kind as NotificationKind,
    title: n.title as string,
    body: (n.body as string) ?? null,
    link: (n.link as string) ?? null,
    read: Boolean(n.read_at),
    createdAt: n.created_at as string,
  }));
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return SAMPLE_NOTIFICATIONS.filter((n) => !n.read).length;
  const user = await getSessionUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) {
    if (schemaMissing(error)) return SAMPLE_NOTIFICATIONS.filter((n) => !n.read).length;
    return 0;
  }
  return count ?? 0;
}

export async function getPrefs(): Promise<NotificationPrefs> {
  const supabase = await createClient();
  if (!supabase) return DEFAULT_PREFS;
  const user = await getSessionUser();
  if (!user) return DEFAULT_PREFS;

  const { data, error } = await supabase
    .from("notification_prefs")
    .select("announcements, messages, mentions, monthly_digest")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error || !data) return DEFAULT_PREFS;
  return {
    announcements: data.announcements as boolean,
    messages: data.messages as boolean,
    mentions: data.mentions as boolean,
    monthlyDigest: data.monthly_digest as boolean,
  };
}
