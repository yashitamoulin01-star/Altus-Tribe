import { Bar, ListSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[680px] px-6 pt-8 sm:px-10">
      <Bar className="mb-4 h-3 w-24" />
      <Bar className="h-10 w-[min(12ch,70%)]" />
      <ListSkeleton rows={7} />
    </main>
  );
}
