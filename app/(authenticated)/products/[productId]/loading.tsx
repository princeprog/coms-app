import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div
      aria-label="Loading product"
      aria-busy="true"
      className="flex flex-col gap-5"
    >
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  );
}
