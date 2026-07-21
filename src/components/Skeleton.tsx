// Shared loading-skeleton primitives (route-level `loading.tsx` fallbacks).
// Pulsing neutral blocks that echo the real layout so streaming feels intentional.

export function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-sunk ${className}`} />;
}

export function PageHeaderSkeleton() {
  return (
    <div className="pb-2 pt-4">
      <Bar className="mb-5 h-3 w-28" />
      <Bar className="h-10 w-[min(18ch,90%)]" />
      <Bar className="mt-5 h-4 w-[min(40ch,90%)]" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded border border-hairline bg-surface">
      <Bar className="aspect-[4/5] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Bar className="h-4 w-3/4" />
        <Bar className="h-3 w-1/2" />
        <Bar className="h-3 w-full" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Bar className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bar className="h-4 w-1/3" />
            <Bar className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
