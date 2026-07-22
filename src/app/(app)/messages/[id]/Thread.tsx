"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "../actions";
import { deleteMessage } from "@/app/admin/actions";
import type { MessageView } from "@/lib/messaging";

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function Thread({
  conversationId,
  initialMessages,
  currentUserId,
  isAdmin = false,
}: {
  conversationId: string;
  initialMessages: MessageView[];
  currentUserId: string | null;
  isAdmin?: boolean;
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
            const mapped: MessageView = {
              id: row.id,
              senderId: row.sender_id,
              senderName: row.sender_id === currentUserId ? "You" : "Member",
              body: row.body,
              createdAt: row.created_at,
              mine: row.sender_id === currentUserId,
            };
            if (row.sender_id === currentUserId) {
              const i = prev.findIndex(
                (m) => m.id.startsWith("tmp-") && m.body === row.body,
              );
              if (i !== -1) {
                const next = [...prev];
                next[i] = mapped;
                return next;
              }
            }
            return [...prev, mapped];
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
        setError("Couldn't send message. Tap to retry.");
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setDraft(text);
      }
    });
  };

  const moderate = (id: string) => {
    if (!isAdmin || id.startsWith("tmp-")) return;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    startTransition(async () => {
      const res = await deleteMessage(id);
      if (!res.ok) setError("Couldn't remove that message.");
    });
  };

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col justify-between">
      {/* Scrollback Message List */}
      <div className="flex-1 space-y-4 py-6 px-1">
        {messages.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-[14px] text-ink-muted">No messages yet. Send a greeting to start the conversation.</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}
          >
            {!m.mine && (
              <span className="mb-1 ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                {m.senderName}
              </span>
            )}
            <div className="group flex items-center gap-2 max-w-[85%] sm:max-w-[75%]">
              {isAdmin && m.mine && !m.id.startsWith("tmp-") && (
                <button
                  type="button"
                  onClick={() => moderate(m.id)}
                  aria-label="Remove message"
                  title="Remove message (admin)"
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted opacity-0 transition-opacity hover:text-red group-hover:opacity-100"
                >
                  Remove
                </button>
              )}
              <div
                className={`rounded-2xl px-4.5 py-3 text-[14px] leading-relaxed shadow-sm transition-all ${
                  m.mine
                    ? "bg-red text-white shadow-red/20 rounded-br-xs"
                    : "border border-hairline/80 bg-surface/90 text-ink backdrop-blur-md rounded-bl-xs"
                }`}
              >
                {m.body}
              </div>
              {isAdmin && !m.mine && !m.id.startsWith("tmp-") && (
                <button
                  type="button"
                  onClick={() => moderate(m.id)}
                  aria-label="Remove message"
                  title="Remove message (admin)"
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted opacity-0 transition-opacity hover:text-red group-hover:opacity-100"
                >
                  Remove
                </button>
              )}
            </div>
            <span className="mt-1 px-2 font-mono text-[9px] text-ink-muted/80">
              {fmtTime(m.createdAt)}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Composer Bar */}
      <div className="sticky bottom-0 border-t border-hairline/80 bg-paper/95 pt-3 pb-4 backdrop-blur-xl">
        {error && (
          <button
            type="button"
            onClick={submit}
            className="mb-2 block font-mono text-[12px] text-red hover:text-red-hover"
          >
            ⚠️ {error}
          </button>
        )}
        <div className="flex items-end gap-2.5">
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
            className="max-h-36 min-h-[46px] flex-1 resize-none rounded-xl border border-hairline bg-surface-sunk/80 px-4 py-3 text-[14px] text-ink placeholder:text-ink-muted focus:border-red focus:outline-none focus:ring-2 focus:ring-red/20 transition-all"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || pending}
            className="h-[46px] shrink-0 rounded-xl bg-red px-5 text-[14px] font-semibold text-white shadow-md shadow-red/20 transition-all hover:bg-red-hover active:scale-95 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

