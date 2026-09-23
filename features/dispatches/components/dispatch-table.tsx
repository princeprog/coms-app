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
import type { DispatchPage } from "@/features/dispatches/types/dispatch.types";

export function DispatchTable({ page }: { page: DispatchPage }) {
  return (
    <section
      aria-labelledby="dispatches-heading"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="dispatches-heading" className="text-lg font-semibold">
          Dispatches
        </h2>
        <p className="text-sm text-muted-foreground">{page.total} total</p>
      </div>
      <Table aria-label="Dispatches">
        <TableHeader>
          <TableRow>
            <TableHead>Branch</TableHead>
            <TableHead>Request</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Dispatched</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.items.map((dispatch) => (
            <TableRow key={dispatch.id}>
              <TableCell className="font-medium">
                {dispatch.branch_name}
              </TableCell>
              <TableCell>
                <Link
                  className={buttonVariants({ variant: "link", size: "sm" })}
                  href={`/replenishment/${dispatch.stock_request_id}`}
                >
                  View request
                </Link>
              </TableCell>
              <TableCell>{dispatch.item_count}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {dispatch.status.replaceAll("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                {format(parseISO(dispatch.created_at), "PPp")}
              </TableCell>
              <TableCell>
                {dispatch.dispatched_at
                  ? format(parseISO(dispatch.dispatched_at), "PPp")
                  : "Not dispatched"}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  href={`/dispatches/${dispatch.id}`}
                >
                  View dispatch
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
