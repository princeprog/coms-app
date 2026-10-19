import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function BalanceSkeleton() {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-2 border-b px-4 py-4 sm:px-5">
        <Skeleton className="h-5 w-36 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Table aria-hidden="true" className="min-w-2xl">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4 sm:pl-5">Stock item</TableHead>
            <TableHead className="hidden lg:table-cell">Category</TableHead>
            <TableHead className="pr-4 text-right sm:pr-5">
              Available stock
            </TableHead>
            <TableHead className="pl-6 sm:pl-8">Units</TableHead>
            <TableHead className="pl-6 sm:pl-8">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }, (_, index) => (
            <TableRow key={index}>
              <TableCell className="py-3 pl-4 sm:pl-5">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="pr-4 sm:pr-5">
                <Skeleton className="ml-auto h-4 w-16" />
              </TableCell>
              <TableCell className="pl-6 sm:pl-8">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="pl-6 sm:pl-8">
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

function ActivitySkeleton() {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-2 border-b px-4 py-4 sm:px-5">
        <Skeleton className="h-5 w-32 max-w-full" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <Table aria-hidden="true" className="min-w-2xl">
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="pl-4 sm:pl-5">Stock item</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead className="text-right">Quantity change</TableHead>
            <TableHead className="pr-4 text-right sm:pr-5">
              Recorded at
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }, (_, index) => (
            <TableRow key={index}>
              <TableCell className="w-1/3 py-4 pl-4 sm:pl-5">
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-4 w-20" />
              </TableCell>
              <TableCell className="pr-4 sm:pr-5">
                <Skeleton className="ml-auto h-4 w-24" />
                <Skeleton className="mt-1 ml-auto h-3 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between gap-3 border-t px-4 py-3 sm:px-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
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
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-[20rem_1fr]">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_minmax(22rem,0.75fr)]">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-6">
        <BalanceSkeleton />
        <ActivitySkeleton />
      </div>
      <span className="sr-only" role="status">
        Loading inventory balances and movements.
      </span>
    </div>
  );
}
