"use client";

import React from "react";
import AnimatedList from "@/components/AnimatedList";

export interface NotificationFeedItem {
  id: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read?: boolean;
  time?: string;
}

export default function NotificationListWrapper({ items }: { items: NotificationFeedItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <AnimatedList
      items={items}
      showGradients={true}
      enableArrowNavigation={true}
      displayScrollbar={false}
      onItemSelect={(item) => {
        if (item.link) window.location.href = item.link;
      }}
      renderItem={(n, isSelected) => (
        <div className={`flex items-start gap-3 transition-colors ${isSelected ? "text-red" : ""}`}>
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-hairline" : "bg-red animate-pulse"}`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-ink">{n.title}</p>
            {n.body && <p className="truncate text-[13px] text-ink-muted">{n.body}</p>}
          </div>
          {n.time && <span className="shrink-0 font-mono text-[11px] text-ink-muted">{n.time}</span>}
        </div>
      )}
    />
  );
}
