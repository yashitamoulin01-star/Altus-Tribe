import { PageHeaderSkeleton, Bar, CardGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 sm:px-10">
      <div className="py-6" />
      <PageHeaderSkeleton />
      <Bar className="mt-10 h-14 w-full" />
      <CardGridSkeleton count={8} />
    </main>
  );
}
