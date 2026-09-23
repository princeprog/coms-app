import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StockRequestPage } from "@/features/stock-requests/types/stock-request.types";

export function StockRequestTable({ page }: { page: StockRequestPage }) {
  return (
    <section
      aria-labelledby="stock-requests-heading"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="stock-requests-heading" className="text-lg font-semibold">
          Stock requests
        </h2>
        <p className="text-sm text-muted-foreground">{page.total} total</p>
      </div>
      <Table aria-label="Stock requests">
        <TableHeader>
          <TableRow>
            <TableHead>Branch</TableHead>
            <TableHead>Requested by</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.items.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">
                {request.branch_name}
              </TableCell>
              <TableCell>{request.requester_name}</TableCell>
              <TableCell>{request.item_count}</TableCell>
              <TableCell>
                <Badge variant="outline">{request.status}</Badge>
              </TableCell>
              <TableCell>
                {format(parseISO(request.created_at), "PPp")}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  href={`/replenishment/${request.id}`}
                >
                  View request
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
