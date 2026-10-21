import { Skeleton } from "@/components/ui/skeleton";

export default function SalesReportLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading sales report"
      className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6"
    >
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-11 w-full max-w-xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
