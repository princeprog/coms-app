import { Skeleton } from "@/components/ui/skeleton";

export default function PosLoading() {
  return (
    <div
      className="flex min-w-0 flex-col gap-6 p-4 md:p-6"
      aria-busy="true"
      aria-label="Loading point of sale"
    >
      <Skeleton className="h-9 w-56" />
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Skeleton className="h-11 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <span role="status" className="sr-only">
        Loading point of sale…
      </span>
    </div>
  );
}
