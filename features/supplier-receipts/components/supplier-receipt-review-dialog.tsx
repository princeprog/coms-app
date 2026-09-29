"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { CreateSupplierReceipt } from "@/features/supplier-receipts/types/supplier-receipt.types";
import { calculateSupplierReceiptTotal } from "@/features/supplier-receipts/services/supplier-receipt-total";

export function SupplierReceiptReviewDialog({
  input,
  supplierName,
  pending,
  onOpenChange,
  onConfirm,
}: {
  input: CreateSupplierReceipt | null;
  supplierName: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={Boolean(input)} onOpenChange={onOpenChange}>
      <AlertDialogContent data-coms-ui="operational" className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Review supplier delivery</AlertDialogTitle>
          <AlertDialogDescription>
            Confirm the delivery details before recording. This immediately
            increases commissary inventory, and the receipt cannot be edited.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {input && (
          <dl className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
            <ReviewField label="Supplier" value={supplierName} />
            <ReviewField label="Delivery date" value={input.received_at} />
            <ReviewField label="Line items" value={String(input.items.length)} />
            <ReviewField
              label="Total cost"
              value={calculateSupplierReceiptTotal(input)}
              numeric
            />
          </dl>
        )}
        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Back to delivery
          </Button>
          <Button type="button" disabled={pending} onClick={onConfirm}>
            {pending ? "Recording…" : "Record delivery"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ReviewField({
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
      <dd className={numeric ? "font-medium tabular-nums" : "font-medium"}>
        {value}
      </dd>
    </div>
  );
}
