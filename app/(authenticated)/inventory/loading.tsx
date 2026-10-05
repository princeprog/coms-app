import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function CollectionSkeleton({ movements = false }: { movements?: boolean }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-2 border-b px-4 py-4 sm:px-5">
        <Skeleton className="h-5 w-36 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Table aria-hidden="true" className="min-w-80">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4 sm:pl-5">Stock item</TableHead>
            <TableHead className="hidden md:table-cell">
              {movements ? "Movement" : "Category"}
            </TableHead>
            <TableHead className="pr-4 text-right sm:pr-5">
              {movements ? "Change" : "On hand"}
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              {movements ? "Recorded" : "Status"}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: movements ? 4 : 6 }, (_, index) => (
            <TableRow key={index}>
              <TableCell className="py-3 pl-4 sm:pl-5">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="pr-4 sm:pr-5">
                <Skeleton className="ml-auto h-4 w-16" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-5 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="border-t px-4 py-3 sm:px-5">
        <Skeleton className="h-6 w-44 max-w-full" />
      </div>
    </div>
  );
}
export default function InventoryLoading() {
  return (
    <div
      className="flex min-w-0 flex-col gap-6 px-4 py-4 md:px-6 md:py-6"
      aria-busy="true"
      aria-label="Loading inventory"
    >
      <div className="flex min-w-0 flex-col gap-2">
        <Skeleton className="h-8 w-36 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full sm:w-80" />
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full md:col-span-2" />
        </div>
        <Skeleton className="h-16 w-full max-w-lg" />
      </div>
      <CollectionSkeleton />
      <CollectionSkeleton movements />
      <span className="sr-only" role="status">
        Loading inventory balances and movements.
      </span>
    </div>
  );
}
