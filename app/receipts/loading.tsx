import { Skeleton } from "@/components/ui/skeleton";

export default function SupplierReceiptsLoading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading supplier receipts"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-5 w-96" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
      <span className="sr-only" role="status">
        Loading supplier receipts.
      </span>
    </div>
  );
}
