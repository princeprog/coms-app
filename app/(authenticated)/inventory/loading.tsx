import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryLoading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading inventory"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-5 w-80" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-12 w-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
      <span className="sr-only" role="status">
        Loading inventory balances and movements.
      </span>
    </div>
  );
}
