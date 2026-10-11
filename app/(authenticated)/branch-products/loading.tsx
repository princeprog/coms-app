import { Skeleton } from "@/components/ui/skeleton";

export default function BranchMenuLoading() {
  return (
    <div
      className="flex min-w-0 flex-col gap-5 p-4 md:p-6"
      aria-busy="true"
      aria-label="Loading branch menu"
    >
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex flex-wrap items-end gap-6 border-b pb-5">
        <Skeleton className="h-16 w-96 max-w-full" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-16 min-w-0 flex-1 basis-80" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-16 flex-1 basis-40" />
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-none" />
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex gap-8 border-t px-5 py-4">
            <Skeleton className="h-8 min-w-0 flex-1" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">
        Loading branch menu…
      </span>
    </div>
  );
}
