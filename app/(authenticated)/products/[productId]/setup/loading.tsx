import { Skeleton } from "@/components/ui/skeleton";
export default function ProductSetupLoading() {
  return (
    <section
      aria-label="Loading product setup"
      aria-busy="true"
      className="flex flex-col gap-6 p-4 sm:p-6"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-5 w-80 max-w-full" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </section>
  );
}
