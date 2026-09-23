import { Skeleton } from "@/components/ui/skeleton";

export default function DispatchesLoading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading dispatches"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-5 w-96" />
        <Skeleton className="h-9 w-48" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
      <span className="sr-only" role="status">
        Loading dispatches.
      </span>
    </div>
  );
}
