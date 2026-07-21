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
  announcement: '◆',
  mention: '@',
  referral: '↗',
  system: '•',
};

// Filter tabs keyed off notification kind. "all" / "unread" are always shown;
// category tabs appear only when at least one notification of that kind exists.
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

  // Reconcile with the server snapshot when it changes (e.g. after markAllRead
  // revalidates) — the documented "reset state on prop change" render-phase pattern.
  const [seenItems, setSeenItems] = useState(items);
  if (items !== seenItems) {
    setSeenItems(items);
    setList(items);
  }

  // Real-time: live-apply inserts/updates for this member's notifications.
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
      { key: 'all', label: 'All' },
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
    <div>
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
              filter === t.key
                ? 'border-ink bg-ink text-paper'
                : 'border-hairline text-ink-secondary hover:border-ink-muted'
            }`}
          >
            {t.label}
            {t.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 font-mono text-[11px]">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-[17px] text-ink-secondary">
          {filter === 'unread' ? "You're all caught up." : 'Nothing here yet.'}
        </p>
      ) : (
        <AnimatedList
          items={filtered}
          onItemSelect={handleSelect}
          showGradients
          displayScrollbar={false}
          className="mt-4"
          renderItem={(n: Notification, isSelected: boolean) => (
            <div
              className={`flex gap-4 py-2 transition-all duration-150 ${
                n.read ? '' : 'rounded border-l-2 border-red pl-3 -ml-3'
              } ${isSelected ? 'opacity-80' : ''}`}
            >
              <span
                aria-hidden
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hairline font-mono text-[13px] text-ink-muted"
              >
                {GLYPH[n.kind] ?? '•'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px] font-medium text-ink">{n.title}</p>
                  <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                    {relTime(n.createdAt)}
                  </span>
                </div>
                {n.body && (
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-secondary">{n.body}</p>
                )}
              </div>
              {!n.read && (
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red"
                  aria-label="unread"
                />
              )}
            </div>
          )}
        />
      )}
    </div>
  );
}
