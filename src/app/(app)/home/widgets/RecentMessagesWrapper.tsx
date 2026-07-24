"use client";

import React from "react";
import AnimatedList from "@/components/AnimatedList";

export interface ConversationItem {
  id: string;
  title: string;
  avatarUrl?: string | null;
  snippet?: string | null;
  unread: number;
}

export default function RecentMessagesWrapper({ convos }: { convos: ConversationItem[] }) {
  if (!convos || convos.length === 0) return null;

  return (
    <AnimatedList
      items={convos}
      showGradients={true}
      enableArrowNavigation={true}
      displayScrollbar={false}
      onItemSelect={(c) => {
        window.location.href = `/messages/${c.id}`;
      }}
      renderItem={(c, isSelected) => (
        <div className={`flex items-center gap-3 transition-colors ${isSelected ? "text-red" : ""}`}>
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-sm font-semibold text-ink overflow-hidden border border-hairline">
            {c.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.avatarUrl} alt={c.title} className="h-full w-full object-cover" />
            ) : (
              <span>{c.title ? c.title[0]?.toUpperCase() : "?"}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-ink">{c.title}</p>
            <p className="truncate text-[13px] text-ink-muted">{c.snippet || "No messages yet"}</p>
          </div>

          {c.unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red px-1.5 text-[11px] font-medium text-paper">
              {c.unread > 9 ? "9+" : c.unread}
            </span>
          )}
        </div>
      )}
    />
  );
}
