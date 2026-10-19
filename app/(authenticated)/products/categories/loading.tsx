import { Skeleton } from "@/components/ui/skeleton";
export default function LoadingCategories() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading categories"
      aria-busy="true"
    >
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
