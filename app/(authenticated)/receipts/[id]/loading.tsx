import { Skeleton } from "@/components/ui/skeleton";

export default function SupplierReceiptDetailLoading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading supplier receipt"
    >
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-72 w-full" />
      <span className="sr-only" role="status">
        Loading supplier receipt details.
      </span>
    </div>
  );
}
