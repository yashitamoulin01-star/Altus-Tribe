import { Bar, PageHeaderSkeleton, CardGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 sm:px-10">
      <div className="py-6" />
      <PageHeaderSkeleton />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bar key={i} className="h-20 w-full" />
        ))}
      </div>
      <CardGridSkeleton count={4} />
    </main>
  );
}
