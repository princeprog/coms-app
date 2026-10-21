import { Skeleton } from "@/components/ui/skeleton";

export default function CostsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading costs and profit"
      className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6"
    >
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-9 w-80" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
