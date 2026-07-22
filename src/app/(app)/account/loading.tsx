import { Bar, PageHeaderSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-6 sm:px-10">
      <div className="py-6" />
      <PageHeaderSkeleton />
      <div className="mt-8 space-y-4">
        <Bar className="h-12 w-full" />
        <Bar className="h-12 w-full" />
        <Bar className="h-10 w-40" />
      </div>
    </main>
  );
}
