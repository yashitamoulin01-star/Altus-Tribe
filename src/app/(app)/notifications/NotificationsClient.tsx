'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedList from '@/components/AnimatedList';
import { createClient } from '@/lib/supabase/client';
import { markRead } from './actions';

interface Notification {
  id: string;
  kind: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

const GLYPH: Record<string, string> = {
  message: '✉',
  announcement: '📢',
  mention: '@',
  referral: '🤝',
  system: '⚡',
};

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'message', label: 'Messages' },
  { key: 'announcement', label: 'Announcements' },
  { key: 'referral', label: 'Referrals' },
  { key: 'mention', label: 'Mentions' },
  { key: 'system', label: 'System' },
];

function relTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

type RowChange = {
  new: {
    id: string;
    kind: string;
    title: string;
    body: string | null;
    link: string | null;
    read_at: string | null;
    created_at: string;
  };
};

export default function NotificationsClient({
  items,
  userId,
}: {
  items: Notification[];
  userId: string | null;
}) {
  const router = useRouter();
  const [list, setList] = useState<Notification[]>(items);
  const [filter, setFilter] = useState<string>('all');

  const [seenItems, setSeenItems] = useState(items);
  if (items !== seenItems) {
    setSeenItems(items);
    setList(items);
  }

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    if (!supabase) return;

    const upsert = (r: RowChange['new']) =>
      setList((prev) => {
        const row: Notification = {
          id: r.id,
          kind: r.kind,
          title: r.title,
          body: r.body,
          link: r.link,
          read: Boolean(r.read_at),
          createdAt: r.created_at,
        };
        const i = prev.findIndex((n) => n.id === row.id);
        if (i === -1) return [row, ...prev];
        const next = [...prev];
        next[i] = row;
        return next;
      });

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => upsert((payload as unknown as RowChange).new),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => upsert((payload as unknown as RowChange).new),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const tabs = useMemo(() => {
    const present = new Set(list.map((n) => n.kind));
    return [
      { key: 'all', label: 'All Activity' },
      { key: 'unread', label: 'Unread' },
      ...CATEGORIES.filter((c) => present.has(c.key)),
    ];
  }, [list]);

  const filtered = useMemo(() => {
    if (filter === 'all') return list;
    if (filter === 'unread') return list.filter((n) => !n.read);
    return list.filter((n) => n.kind === filter);
  }, [list, filter]);

  const unreadCount = list.filter((n) => !n.read).length;

  const handleSelect = (item: Notification) => {
    if (!item.read) {
      setList((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
      );
      void markRead(item.id);
    }
    if (item.link) router.push(item.link);
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={`rounded-xl px-4 py-2 text-[13px] font-medium transition-all ${
              filter === t.key
                ? 'bg-red text-white shadow-md shadow-red/20'
                : 'border border-hairline bg-surface/80 text-ink-secondary hover:border-hairline-bright hover:text-ink'
            }`}
          >
            {t.label}
            {t.key === 'unread' && unreadCount > 0 && (
              <span className="ml-2 font-mono text-[10px] rounded-full bg-white/20 px-1.5 py-0.5 text-white font-bold">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-hairline rounded-2xl bg-surface/40">
          <p className="text-3xl mb-2">🔔</p>
          <p className="text-[15px] font-medium text-ink">
            {filter === 'unread' ? "You're all caught up." : 'No notifications yet.'}
          </p>
          <p className="mt-1 text-[13px] text-ink-muted">All updates from Sacred Space, messages, and mentions will show up here.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-hairline/80 bg-surface/80 p-2 backdrop-blur-md">
          <AnimatedList
            items={filtered}
            onItemSelect={handleSelect}
            showGradients
            displayScrollbar={false}
            renderItem={(n: Notification, isSelected: boolean) => (
              <div
                className={`flex gap-4 p-3 rounded-xl transition-all duration-200 ${
                  n.read ? 'opacity-90' : 'bg-surface-hover/80 border-l-2 border-red pl-4'
                } ${isSelected ? 'border-red/60 shadow-lg shadow-red/5' : ''}`}
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-hairline bg-surface-sunk font-mono text-[14px] text-red shadow-inner"
                >
                  {GLYPH[n.kind] ?? '•'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`text-[15px] ${n.read ? 'font-medium text-ink' : 'font-bold text-ink'}`}>{n.title}</p>
                    <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                      {relTime(n.createdAt)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">{n.body}</p>
                  )}
                </div>
                {!n.read && (
                  <span
                    className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-red red-dot-pulse"
                    aria-label="unread"
                  />
                )}
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}

