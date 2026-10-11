import { Skeleton } from "@/components/ui/skeleton";

export default function BranchesLoading() {
  return (
    <div
      role="status"
      aria-label="Loading branches"
      aria-busy="true"
      className="flex min-w-0 flex-col gap-6 px-4 py-4 md:px-6 md:py-6"
    >
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex min-w-0 max-w-full flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-4 border-b pb-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-5 w-20" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Skeleton className="h-14 sm:col-span-2 xl:col-span-3" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <Skeleton className="h-11" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="grid grid-cols-3 items-center gap-4 border-b px-4 pb-4 md:grid-cols-5"
          >
            <div className="col-span-2 flex flex-col gap-2 md:col-span-1">
              <Skeleton className="h-5 w-36 max-w-full" />
              <Skeleton className="h-3 w-52 max-w-full" />
            </div>
            <Skeleton className="hidden h-5 md:block" />
            <Skeleton className="hidden h-5 md:block" />
            <Skeleton className="h-5 w-14" />
            <Skeleton className="hidden size-8 justify-self-end md:block" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading branches…</span>
    </div>
  );
}
