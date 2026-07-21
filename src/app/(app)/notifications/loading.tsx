import { Bar, ListSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[680px] px-6 pt-8 sm:px-10">
      <div className="border-b border-hairline pb-6">
        <Bar className="mb-4 h-3 w-28" />
        <Bar className="h-10 w-[min(14ch,80%)]" />
      </div>
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bar key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <ListSkeleton rows={6} />
    </main>
  );
}
