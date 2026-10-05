import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export function CatalogDirectoryLoading({ title }: { title: string }) {
  const stockItems = title === "Stock Items";
  return (
    <div
      className="flex min-w-0 flex-col gap-6 px-4 py-4 md:px-6 md:py-6"
      aria-busy="true"
      aria-label={`Loading ${title.toLowerCase()}`}
    >
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex min-w-0 max-w-full flex-col gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-16 w-full sm:flex-1" />
          <Skeleton className="h-16 w-full sm:w-48" />
        </div>
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <Card className="min-w-0 gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <Skeleton className="h-5 w-40 max-w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-80">
              <div className="flex items-center gap-4 border-b px-4 py-3 sm:px-5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="ml-auto h-4 w-20" />
              </div>
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0 sm:px-5"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-48 max-w-full" />
                    <Skeleton className="h-4 w-24 lg:hidden" />
                    <Skeleton className="h-5 w-14 md:hidden" />
                  </div>
                  {stockItems ? (
                    <Skeleton className="h-4 w-12" />
                  ) : (
                    <Skeleton className="hidden h-4 w-40 lg:block" />
                  )}
                  <Skeleton className="hidden h-5 w-16 md:block" />
                  <Skeleton className="size-7" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-3 border-t px-4 py-3 sm:px-5">
          <Skeleton className="h-4 w-44 max-w-full" />
          <Skeleton className="h-7 w-24" />
        </CardFooter>
      </Card>
      <span role="status" className="sr-only">
        Loading {title.toLowerCase()}.
      </span>
    </div>
  );
}
