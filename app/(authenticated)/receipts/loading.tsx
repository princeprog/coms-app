import { Skeleton } from "@/components/ui/skeleton";

export default function SupplierReceiptsLoading() {
  return (
    <div
      className="flex min-w-0 flex-col gap-6 px-4 py-4 md:px-6 md:py-6"
      aria-busy="true"
      aria-label="Loading supplier receipts"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-60 max-w-full" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <Skeleton className="h-9 w-44 max-w-full" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <Skeleton className="h-8 w-44 max-w-full" />
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
        <Skeleton className="h-8 w-full" />
      </div>
      <span className="sr-only" role="status">
        Loading supplier receipts.
      </span>
    </div>
  );
}
