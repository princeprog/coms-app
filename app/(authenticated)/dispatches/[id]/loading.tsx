import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DispatchDetailLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading dispatch details"
      className="flex min-w-0 flex-col gap-6 p-4 md:p-6"
    >
      <Skeleton className="h-4 w-32 max-w-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-96 max-w-full" />
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col items-start gap-2 sm:items-center"
          >
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-24 max-w-full" />
            <Skeleton className="h-3 w-32 max-w-full" />
          </div>
        ))}
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Card key={index} className="min-w-0">
            <CardHeader>
              <Skeleton className="h-6 w-48 max-w-full" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {Array.from({ length: 4 }, (_, row) => (
                <Skeleton key={row} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <span role="status" className="sr-only">
        Loading dispatch details.
      </span>
    </div>
  );
}
