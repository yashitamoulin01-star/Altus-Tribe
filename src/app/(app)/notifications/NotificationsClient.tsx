'use client';
import { useRouter } from 'next/navigation';
import AnimatedList from '@/components/AnimatedList';

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

export default function NotificationsClient({ items }: { items: Notification[] }) {
  const router = useRouter();

  const handleSelect = (item: Notification) => {
    if (item.link) router.push(item.link);
  };

  return (
    <AnimatedList
      items={items}
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
              <span className="shrink-0 font-mono text-[11px] text-ink-muted">{relTime(n.createdAt)}</span>
            </div>
            {n.body && (
              <p className="mt-1 text-[14px] leading-relaxed text-ink-secondary">{n.body}</p>
            )}
          </div>
          {!n.read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red" aria-label="unread" />
          )}
        </div>
      )}
    />
  );
}
