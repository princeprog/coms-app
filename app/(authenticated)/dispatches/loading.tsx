import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DispatchesLoading() {
  return (
    <div
      className="flex min-w-0 flex-col gap-6 px-4 py-4 md:px-6 md:py-6"
      aria-busy="true"
      aria-label="Loading dispatches"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-44 max-w-full" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <Skeleton className="h-9 w-44 max-w-full" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="min-w-0 overflow-hidden rounded-xl border">
        <div className="flex flex-col gap-2 border-b px-4 py-4 sm:px-5">
          <Skeleton className="h-5 w-36 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Table aria-hidden="true" className="min-w-80">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4 sm:pl-5">Branch</TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                Stock items
              </TableHead>
              <TableHead>Delivery status</TableHead>
              <TableHead className="hidden md:table-cell">
                Discrepancy
              </TableHead>
              <TableHead className="hidden lg:table-cell">Dispatched</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }, (_, index) => (
              <TableRow key={index}>
                <TableCell className="py-4 pl-4 sm:pl-5">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20 sm:hidden" />
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="ml-auto h-4 w-6" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </TableCell>
                <TableCell className="pr-4 sm:pr-5">
                  <Skeleton className="size-7" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3 sm:px-5">
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <span className="sr-only" role="status">
        Loading dispatches.
      </span>
    </div>
  );
}
