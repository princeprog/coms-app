"use client";

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
import type { SupplierReceipt } from "@/features/supplier-receipts/types/supplier-receipt.types";

export function SupplierReceiptDetailView({
  receipt,
}: {
  receipt: SupplierReceipt;
}) {
  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className:
              "h-auto min-h-8 max-w-full whitespace-normal text-center leading-snug",
          })}
          href="/receipts"
        >
          Back to supplier receiving
        </Link>
      </div>
      <section
        aria-labelledby="receipt-summary-heading"
        className="rounded-lg border bg-card"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 md:p-5">
          <div className="space-y-1">
            <h2 id="receipt-summary-heading" className="text-lg font-semibold">
              Supplier delivery record
            </h2>
            <p className="text-sm text-muted-foreground">
              {receipt.supplier_name}
            </p>
          </div>
        </div>
        <dl className="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-5 md:p-5">
          <DetailField
            label="Delivery date"
            value={format(parseISO(receipt.received_at), "PPP")}
          />
          <DetailField
            label="Line items"
            value={String(receipt.items.length)}
          />
          <DetailField label="Total cost" value={receipt.total_cost} numeric />
          <DetailField label="Recorded by" value={receipt.recorded_by_name} />
          <DetailField
            label="Recorded at"
            value={format(parseISO(receipt.recorded_at), "PPp")}
          />
        </dl>
      </section>
      <section aria-labelledby="receipt-items-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="receipt-items-heading" className="text-lg font-semibold">
              Received items
            </h2>
            <p className="text-sm text-muted-foreground">
              Quantities and costs recorded for this delivery.
            </p>
          </div>
        </div>
        <Table
          aria-label="Receipt items"
          containerProps={{
            role: "region",
            "aria-label": "Receipt items table",
            tabIndex: 0,
            className: "rounded-lg border",
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Stock item</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit cost</TableHead>
              <TableHead className="text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipt.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.stock_item_name}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.quantity_received} {item.unit}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.unit_cost}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.line_total}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="text-right font-semibold">
                Total cost
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {receipt.total_cost}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function DetailField({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: string;
  numeric?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={"font-medium " + (numeric ? "tabular-nums" : "")}>
        {value}
      </dd>
    </div>
  );
}
