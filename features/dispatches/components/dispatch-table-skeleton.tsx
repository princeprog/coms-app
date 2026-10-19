import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DispatchTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <Table
      aria-hidden="true"
      className="min-w-80 motion-reduce:[&_[data-slot=skeleton]]:animate-none"
    >
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4 sm:pl-5">Branch</TableHead>
          <TableHead className="hidden sm:table-cell">Stock items</TableHead>
          <TableHead>Delivery status</TableHead>
          <TableHead className="hidden md:table-cell">Discrepancy</TableHead>
          <TableHead className="hidden lg:table-cell">Dispatched</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }, (_, index) => (
          <TableRow key={index}>
            <TableCell className="py-3 pl-4 sm:pl-5">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-20 sm:hidden" />
                <Skeleton className="h-4 w-24 lg:hidden" />
              </div>
            </TableCell>
            <TableCell className="hidden py-3 sm:table-cell">
              <Skeleton className="h-5 w-6" />
            </TableCell>
            <TableCell className="py-3">
              <Skeleton className="h-5 w-24" />
            </TableCell>
            <TableCell className="hidden py-3 md:table-cell">
              <Skeleton className="h-5 w-24" />
            </TableCell>
            <TableCell className="hidden py-3 lg:table-cell">
              <Skeleton className="h-5 w-44" />
            </TableCell>
            <TableCell className="py-3 pr-4 sm:pr-5">
              <Skeleton className="ml-auto size-7" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
