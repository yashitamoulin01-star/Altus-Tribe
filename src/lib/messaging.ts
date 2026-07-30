import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

// Messaging data layer (docs/11-spec-messaging-notifications.md). Real-time chat
// backed by Supabase; falls back to bundled sample threads when Supabase is
// unconfigured or unmigrated — the same offline-first pattern as members-data.ts.

export type ConversationKind = "direct" | "group" | "support";

export interface ConversationSummary {
  id: string;
  kind: ConversationKind;
  title: string; // resolved display title (group name, or the other member)
  snippet: string; // last message preview
  lastMessageAt: string | null;
  unread: number;
  avatarUrl: string | null;
}

export interface MessageView {
  id: string;
  senderId: string | null;
  senderName: string;
  body: string;
  createdAt: string;
  mine: boolean;
}

export interface ConversationDetail {
  id: string;
  kind: ConversationKind;
  title: string;
  memberNames: string[];
  messages: MessageView[];
}

export interface GroupMember {
  id: string;
  name: string;
  photoUrl: string | null;
  isOwner: boolean;
}

export interface GroupInfo {
  id: string;
  title: string;
  members: GroupMember[];
  isOwner: boolean; // is the caller the group's owner/creator
  meId: string;
}

const schemaMissing = (e: { code?: string } | null) =>
  e?.code === "PGRST205" || e?.code === "42P01";

// --- Sample fallbacks ------------------------------------------------------

const SAMPLE_CONVERSATIONS: ConversationSummary[] = [
  {
    id: "sample-manan",
    kind: "support",
    title: "Manan Vasa · Sacred Space",
    snippet: "Welcome to the Tribe — reach out any time you need me.",
    lastMessageAt: "2026-07-20T09:12:00Z",
    unread: 1,
    avatarUrl: null,
  },
  {
    id: "sample-arjun",
    kind: "direct",
    title: "Arjun Nair",
    snippet: "Happy to intro you to our fintech group — let's talk.",
    lastMessageAt: "2026-07-19T17:40:00Z",
    unread: 0,
    avatarUrl: null,
  },
  {
    id: "sample-founders",
    kind: "group",
    title: "Founders in Manufacturing",
    snippet: "Priya: sharing the KPI one-pager from Campus 👇",
    lastMessageAt: "2026-07-18T11:05:00Z",
    unread: 0,
    avatarUrl: null,
  },
];

const SAMPLE_THREADS: Record<string, ConversationDetail> = {
  "sample-manan": {
    id: "sample-manan",
    kind: "support",
    title: "Manan Vasa · Sacred Space",
    memberNames: ["Manan Vasa", "You"],
    messages: [
      {
        id: "m1",
        senderId: "manan",
        senderName: "Manan Vasa",
        body: "Welcome to the Tribe — reach out any time you need me.",
        createdAt: "2026-07-20T09:12:00Z",
        mine: false,
      },
    ],
  },
  "sample-arjun": {
    id: "sample-arjun",
    kind: "direct",
    title: "Arjun Nair",
    memberNames: ["Arjun Nair", "You"],
    messages: [
      {
        id: "a1",
        senderId: "arjun",
        senderName: "Arjun Nair",
        body: "Saw your feature — we should compare notes on scaling ops.",
        createdAt: "2026-07-19T17:30:00Z",
        mine: false,
      },
      {
        id: "a2",
        senderId: "me",
        senderName: "You",
        body: "Would love that. Free Thursday afternoon?",
        createdAt: "2026-07-19T17:35:00Z",
        mine: true,
      },
      {
        id: "a3",
        senderId: "arjun",
        senderName: "Arjun Nair",
        body: "Happy to intro you to our fintech group — let's talk.",
        createdAt: "2026-07-19T17:40:00Z",
        mine: false,
      },
    ],
  },
  "sample-founders": {
    id: "sample-founders",
    kind: "group",
    title: "Founders in Manufacturing",
    memberNames: ["Priya Deshmukh", "Rohan Mehta", "You"],
    messages: [
      {
        id: "f1",
        senderId: "priya",
        senderName: "Priya Deshmukh",
        body: "Sharing the KPI one-pager from Campus 👇",
        createdAt: "2026-07-18T11:05:00Z",
        mine: false,
      },
    ],
  },
};

// --- Reads -----------------------------------------------------------------

export async function getConversations(): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  if (!supabase) return SAMPLE_CONVERSATIONS;

  const user = await getUser();
  if (!user) return SAMPLE_CONVERSATIONS;

  const { data, error } = await supabase
    .from("conversation_members")
    .select(
      `last_read_at,
       conversations!inner (
         id, kind, title, last_message_at,
         messages ( body, created_at )
       )`,
    )
    .eq("profile_id", user.id)
    .order("last_message_at", { referencedTable: "conversations", ascending: false });

  if (error) {
    if (schemaMissing(error)) return SAMPLE_CONVERSATIONS;
    return [];
  }

  // Resolve display titles for direct conversations from the other member.
  const rows = data ?? [];
  const summaries: ConversationSummary[] = [];
  for (const row of rows) {
    // supabase types the embedded relation as an array; take the first.
    const conv = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
    if (!conv) continue;
    const msgs = (conv.messages ?? []) as { body: string; created_at: string }[];
    const last = msgs.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const lastReadAt = row.last_read_at as string | null;
    const unread = msgs.filter(
      (m) => !lastReadAt || m.created_at > lastReadAt,
    ).length;

    let title = (conv.title as string) ?? "Conversation";
    let avatarUrl: string | null = null;
    if (conv.kind === "direct") {
      const other = await supabase
        .from("conversation_members")
        .select("profiles ( full_name, photo_url )")
        .eq("conversation_id", conv.id)
        .neq("profile_id", user.id)
        .limit(1)
        .maybeSingle();
      const p = other.data?.profiles as { full_name?: string; photo_url?: string } | undefined;
      if (p?.full_name) title = p.full_name;
      avatarUrl = p?.photo_url ?? null;
    }

    summaries.push({
      id: conv.id as string,
      kind: conv.kind as ConversationKind,
      title,
      snippet: last?.body ?? "",
      lastMessageAt: (conv.last_message_at as string) ?? null,
      unread,
      avatarUrl,
    });
  }
  return summaries;
}

export async function getConversation(id: string): Promise<ConversationDetail | null> {
  const supabase = await createClient();
  if (!supabase) return SAMPLE_THREADS[id] ?? null;

  const user = await getUser();
  if (!user) return SAMPLE_THREADS[id] ?? null;

  const { data: conv, error } = await supabase
    .from("conversations")
    .select("id, kind, title")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (schemaMissing(error)) return SAMPLE_THREADS[id] ?? null;
    return null;
  }
  if (!conv) return null;

  const { data: members } = await supabase
    .from("conversation_members")
    .select("profile_id, profiles ( full_name )")
    .eq("conversation_id", id);

  const nameById = new Map<string, string>();
  for (const m of members ?? []) {
    const p = m.profiles as { full_name?: string } | undefined;
    nameById.set(m.profile_id as string, p?.full_name ?? "Member");
  }

  const { data: msgs } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const messages: MessageView[] = (msgs ?? []).map((m) => ({
    id: m.id as string,
    senderId: m.sender_id as string | null,
    senderName: m.sender_id ? nameById.get(m.sender_id as string) ?? "Member" : "System",
    body: m.body as string,
    createdAt: m.created_at as string,
    mine: m.sender_id === user.id,
  }));

  // Mark this conversation read for the caller.
  await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .eq("profile_id", user.id);

  let title = (conv.title as string) ?? "Conversation";
  if (conv.kind === "direct") {
    const other = [...nameById.entries()].find(([pid]) => pid !== user.id);
    if (other) title = other[1];
  }

  return {
    id: conv.id as string,
    kind: conv.kind as ConversationKind,
    title,
    memberNames: [...nameById.values()],
    messages,
  };
}

// Group roster + roles for the group-info panel (members list, add/leave controls).
// Returns null when the conversation isn't a readable group for the caller.
export async function getGroupInfo(id: string): Promise<GroupInfo | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const user = await getUser();
  if (!user) return null;

  const { data: conv, error } = await supabase
    .from("conversations")
    .select("id, kind, title")
    .eq("id", id)
    .maybeSingle();
  if (error || !conv || conv.kind !== "group") return null;

  const { data: rows } = await supabase
    .from("conversation_members")
    .select("profile_id, role, profiles ( full_name, photo_url )")
    .eq("conversation_id", id);

  const members: GroupMember[] = (rows ?? []).map((m) => {
    const p = m.profiles as { full_name?: string; photo_url?: string } | undefined;
    return {
      id: m.profile_id as string,
      name: p?.full_name ?? "Member",
      photoUrl: p?.photo_url ?? null,
      isOwner: (m.role as string) === "owner",
    };
  });

  const me = members.find((m) => m.id === user.id);
  return {
    id: conv.id as string,
    title: (conv.title as string) ?? "Group",
    members,
    isOwner: me?.isOwner ?? false,
    meId: user.id,
  };
}
