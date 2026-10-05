"use client";

import { useSupplierReceiptCreateForm } from "../hooks/use-supplier-receipt-create-form";

import type { SupplierReceiptCreateAction } from "@/features/supplier-receipts/types/supplier-receipt.types";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type { Supplier } from "@/features/suppliers/types/supplier.types";
import { SupplierReceiptLineFields } from "./supplier-receipt-line-fields";
import { SupplierReceiptReviewDialog } from "./supplier-receipt-review-dialog";
import { SupplierReceiptDeliveryFields } from "./supplier-receipt-delivery-fields";
import { SupplierReceiptCreateFooter } from "./supplier-receipt-create-footer";
import { FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field";
import { calculateSupplierReceiptTotal } from "../services/supplier-receipt-total";
import { SupplierReceiptLineActions } from "./supplier-receipt-line-actions";

export function SupplierReceiptCreateForm({
  suppliers,
  stockItems,
  action,
  onPendingChange,
  onDirtyChange,
  onCancel,
  onCreated,
}: {
  suppliers: Supplier[];
  stockItems: StockItem[];
  action: SupplierReceiptCreateAction;
  onPendingChange: (pending: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const {
    pending,
    error,
    reviewInput,
    setReviewInput,
    supplierId,
    setSupplierId,
    receivedAt,
    setReceivedAt,
    lines,
    setLines,
    nextLineKey,
    updateLine,
    submit,
    confirmRecord,
  } = useSupplierReceiptCreateForm({
    suppliers,
    stockItems,
    action,
    onPendingChange,
    onDirtyChange,
    onCreated,
  });
  return (
    <form
      onSubmit={submit}
      className="flex min-h-0 flex-1 flex-col"
      aria-label="Record supplier delivery"
    >
      <FieldGroup className="min-h-0 flex-1 gap-5 overflow-y-auto p-4 sm:p-6">
        <FieldSet className="gap-3">
          <FieldLegend variant="label">Delivery details</FieldLegend>
          <SupplierReceiptDeliveryFields
            suppliers={suppliers}
            supplierId={supplierId}
            receivedAt={receivedAt}
            disabled={pending}
            onSupplierChange={(value) => {
              setSupplierId(value);
              onDirtyChange(true);
            }}
            onReceivedAtChange={(value) => {
              setReceivedAt(value);
              onDirtyChange(true);
            }}
          />
        </FieldSet>
        <SupplierReceiptLineFields
          lines={lines}
          stockItems={stockItems}
          disabled={pending}
          onChange={updateLine}
          onRemove={(key) => {
            setLines((current) => current.filter((line) => line.key !== key));
            onDirtyChange(true);
          }}
        />
        <SupplierReceiptLineActions
          pending={pending}
          atLineLimit={lines.length >= 100}
          onAddLine={() => {
            setLines((current) => [
              ...current,
              {
                key: nextLineKey.current++,
                stock_item_id: stockItems[0]?.id ?? "",
                quantity_received: "",
                unit_cost: "",
              },
            ]);
            onDirtyChange(true);
          }}
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </FieldGroup>
      <SupplierReceiptCreateFooter
        pending={pending}
        onCancel={onCancel}
        lineCount={lines.length}
        total={
          lines.every(
            (line) =>
              /^\d+(?:\.\d+)?$/.test(line.quantity_received) &&
              /^\d+(?:\.\d+)?$/.test(line.unit_cost),
          )
            ? calculateSupplierReceiptTotal({
                supplier_id: supplierId,
                received_at: receivedAt,
                items: lines,
              })
            : null
        }
      />
      <SupplierReceiptReviewDialog
        input={reviewInput}
        supplierName={
          suppliers.find((supplier) => supplier.id === reviewInput?.supplier_id)
            ?.supplier_name ?? "—"
        }
        pending={pending}
        onOpenChange={(open) => {
          if (!pending && !open) setReviewInput(null);
        }}
        onConfirm={confirmRecord}
      />
    </form>
  );
}
