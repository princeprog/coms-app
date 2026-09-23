"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SupplierReceipt } from "@/features/supplier-receipts/types/supplier-receipt.types";
import {
  SupplierReceiptPostControl,
  type SupplierReceiptPostAction,
} from "./supplier-receipt-post-control";

export function SupplierReceiptDetailView({
  receipt,
  canPost,
  postAction,
}: {
  receipt: SupplierReceipt;
  canPost: boolean;
  postAction: SupplierReceiptPostAction;
}) {
  const [status, setStatus] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/receipts"
        >
          Back to receiving
        </Link>
        {receipt.status === "DRAFT" && canPost && (
          <SupplierReceiptPostControl
            receiptId={receipt.id}
            action={postAction}
            onComplete={() => setStatus("Supplier receipt posted.")}
          />
        )}
      </div>
      {status && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {status}
        </p>
      )}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Supplier receipt</CardTitle>
            <p className="text-sm text-muted-foreground">
              {receipt.supplier_name}
            </p>
          </div>
          <Badge variant="outline">{receipt.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <DetailField
            label="Received date"
            value={format(parseISO(receipt.received_at), "PPP")}
          />
          <DetailField
            label="Line items"
            value={String(receipt.items.length)}
          />
          <DetailField label="Total cost" value={receipt.total_cost} />
          {receipt.posted_at && (
            <DetailField
              label="Posted at"
              value={format(parseISO(receipt.posted_at), "PPp")}
            />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Received items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table aria-label="Receipt items">
            <TableHeader>
              <TableRow>
                <TableHead>Stock item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit cost</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipt.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.stock_item_name}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {item.quantity_received} {item.unit}
                  </TableCell>
                  <TableCell className="tabular-nums">
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
        </CardContent>
      </Card>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}
