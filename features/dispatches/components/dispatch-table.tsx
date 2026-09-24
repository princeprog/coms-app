import Link from "next/link";
import { format, parseISO } from "date-fns";
import { OperationalStatusBadge } from "@/components/shared/operational-page-ui";
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
      </div>
      <Table
        aria-label="Dispatches"
        containerProps={{
          role: "region",
          "aria-label": "Dispatches table",
          tabIndex: 0,
          className: "rounded-lg border",
        }}
      >
        <TableHeader>
          <TableRow>
            <TableHead>Branch</TableHead>
            <TableHead>Stock request</TableHead>
            <TableHead className="text-right">Items</TableHead>
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
                  aria-label={
                    "View stock request " +
                    dispatch.stock_request_id.slice(0, 8)
                  }
                  href={`/replenishment/${dispatch.stock_request_id}`}
                  title={dispatch.stock_request_id}
                >
                  Request {dispatch.stock_request_id.slice(0, 8)}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {dispatch.item_count}
              </TableCell>
              <TableCell>
                <OperationalStatusBadge variant="outline">
                  {dispatch.status.replaceAll("_", " ")}
                </OperationalStatusBadge>
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
