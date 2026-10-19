import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading staff"
      className="flex min-w-0 flex-col gap-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Staff</h2>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={index === 0 ? "space-y-2 sm:col-span-2" : "space-y-2"}
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="h-10 border-b bg-muted" />
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-6 border-b px-5 py-4 last:border-0"
            >
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="hidden h-4 w-28 sm:block" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
        <CardFooter className="justify-between border-t px-5 py-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-28" />
        </CardFooter>
      </Card>
    </div>
  );
}
