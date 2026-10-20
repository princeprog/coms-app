import { Skeleton } from "@/components/ui/skeleton";
import { DispatchTableSkeleton } from "@/features/dispatches/components/dispatch-table-skeleton";

export default function DispatchesLoading() {
  return (
    <div
      className="flex min-w-0 flex-col gap-6 px-4 py-4 md:px-6 md:py-6 motion-reduce:[&_[data-slot=skeleton]]:animate-none"
      aria-busy="true"
      aria-label="Loading dispatches"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-44 max-w-full" />
        </div>
        <Skeleton className="h-9 w-44 max-w-full" />
      </div>
      <Skeleton className="h-12 w-full max-w-xl" />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_15rem_14rem_11rem]">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
      <div className="min-w-0 overflow-hidden rounded-xl border">
        <DispatchTableSkeleton />
        <div className="border-t px-4 py-3 sm:px-5">
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <span className="sr-only" role="status">
        Loading dispatches.
      </span>
    </div>
  );
}
