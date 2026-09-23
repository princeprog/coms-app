import { Skeleton } from "@/components/ui/skeleton";

export default function ReplenishmentDetailLoading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading stock request"
    >
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-40 w-full" />
      <span className="sr-only" role="status">
        Loading stock request.
      </span>
    </div>
  );
}
