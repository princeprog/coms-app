import { Skeleton } from "@/components/ui/skeleton";

export default function AuthenticatedLoading() {
  return (
    <div
      className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6"
      aria-busy="true"
      aria-label="Loading page"
    >
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-28 w-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
      <span className="sr-only" role="status">
        Loading page content.
      </span>
    </div>
  );
}
