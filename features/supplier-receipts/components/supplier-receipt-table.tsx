import Link from "next/link";
import { format, parseISO } from "date-fns";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SupplierReceiptPage } from "@/features/supplier-receipts/types/supplier-receipt.types";

export function SupplierReceiptTable({ page }: { page: SupplierReceiptPage }) {
  return (
    <section
      aria-labelledby="supplier-deliveries-heading"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="supplier-deliveries-heading" className="text-lg font-semibold">
          Supplier deliveries
        </h2>
        <p className="text-sm text-muted-foreground">{page.total} total</p>
      </div>
      <Table
        aria-label="Supplier deliveries"
        containerProps={{
          role: "region",
          "aria-label": "Supplier deliveries table",
          tabIndex: 0,
          className: "rounded-lg border",
        }}
      >
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead>Delivery date</TableHead>
            <TableHead className="text-right">Items</TableHead>
            <TableHead className="text-right">Total cost</TableHead>
            <TableHead>Recorded</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.items.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell className="font-medium">
                {receipt.supplier_name}
              </TableCell>
              <TableCell>
                {format(parseISO(receipt.received_at), "PP")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {receipt.item_count}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {receipt.total_cost}
              </TableCell>
              <TableCell>
                <span>{format(parseISO(receipt.recorded_at), "PPp")}</span>
                <span className="block text-xs text-muted-foreground">
                  {receipt.recorded_by_name}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  href={`/receipts/${receipt.id}`}
                >
                  View delivery
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
