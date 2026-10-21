import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading audit log"
      className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6"
    >
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-96" />
    </div>
  );
}
