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
import type { SupplierReceiptPage } from "@/features/supplier-receipts/types/supplier-receipt.types";

export function SupplierReceiptTable({ page }: { page: SupplierReceiptPage }) {
  return (
    <section
      aria-labelledby="supplier-receipts-heading"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="supplier-receipts-heading" className="text-lg font-semibold">
          Supplier receipts
        </h2>
        <p className="text-sm text-muted-foreground">{page.total} total</p>
      </div>
      <Table aria-label="Supplier receipts">
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead>Received date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total cost</TableHead>
            <TableHead>Status</TableHead>
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
              <TableCell>{receipt.item_count}</TableCell>
              <TableCell className="tabular-nums">
                {receipt.total_cost}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{receipt.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  href={`/receipts/${receipt.id}`}
                >
                  View receipt
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
