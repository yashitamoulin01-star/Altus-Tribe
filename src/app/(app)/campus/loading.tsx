import { PageHeaderSkeleton, Bar, CardGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 sm:px-10">
      <div className="py-6" />
      <PageHeaderSkeleton />
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bar key={i} className="h-8 w-24" />
        ))}
      </div>
      <CardGridSkeleton count={8} />
    </main>
  );
}
