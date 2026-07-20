"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "../actions";
import type { MessageView } from "@/lib/messaging";

// Live conversation thread. Renders the initial server-loaded messages, then
// subscribes to Supabase Realtime for new rows in this conversation. Sending
// posts through the server action; the optimistic row is reconciled by the
// realtime echo (deduped on id). Enterprise-calm bubbles, no tails/gloss.

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function Thread({
  conversationId,
  initialMessages,
  currentUserId,
}: {
  conversationId: string;
  initialMessages: MessageView[];
  currentUserId: string | null;
}) {
  const [messages, setMessages] = useState<MessageView[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Realtime subscription (no-op when Supabase is unconfigured).
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string | null;
            body: string;
            created_at: string;
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                senderId: row.sender_id,
                senderName: row.sender_id === currentUserId ? "You" : "Member",
                body: row.body,
                createdAt: row.created_at,
                mine: row.sender_id === currentUserId,
              },
            ];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const submit = () => {
    const text = draft.trim();
    if (!text || pending) return;
    setError(null);
    setDraft("");

    // Optimistic echo — reconciled/deduped by the realtime insert.
    const optimistic: MessageView = {
      id: `tmp-${Date.now()}`,
      senderId: currentUserId,
      senderName: "You",
      body: text,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    startTransition(async () => {
      const res = await sendMessage(conversationId, text);
      if (!res.ok && res.error !== "offline") {
        setError("Couldn't send. Tap to retry.");
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setDraft(text);
      }
    });
  };

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col">
      {/* Scrollback */}
      <div className="flex-1 space-y-3 py-6">
        {messages.length === 0 && (
          <p className="py-16 text-center text-[15px] text-ink-muted">
            No messages yet. Say hello.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}
          >
            {!m.mine && (
              <span className="mb-1 ml-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                {m.senderName}
              </span>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                m.mine
                  ? "bg-red text-paper"
                  : "border border-hairline bg-surface text-ink"
              }`}
            >
              {m.body}
            </div>
            <span className="mt-1 px-1 font-mono text-[10px] text-ink-muted">
              {fmtTime(m.createdAt)}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-hairline bg-paper py-3">
        {error && (
          <button
            type="button"
            onClick={submit}
            className="mb-2 block text-[13px] text-red hover:text-red-hover"
          >
            {error}
          </button>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Write a message…"
            maxLength={4000}
            className="max-h-40 min-h-[44px] flex-1 resize-none rounded-lg border border-hairline bg-surface-sunk px-4 py-3 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || pending}
            className="h-[44px] shrink-0 rounded-lg bg-red px-5 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
