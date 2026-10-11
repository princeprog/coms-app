import { Skeleton } from "@/components/ui/skeleton";
export default function PaymentMethodsLoading() {
  return (
    <div
      role="status"
      aria-label="Loading payment methods"
      aria-busy="true"
      className="flex min-w-0 flex-col gap-6 p-4 md:p-6"
    >
      <Skeleton className="h-8 w-60 max-w-full" />
      <Skeleton className="h-10 w-full" />
      {[0, 1, 2, 3].map((row) => (
        <Skeleton key={row} className="h-14 w-full" />
      ))}
      <span className="sr-only">Loading payment methods…</span>
    </div>
  );
}
