"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UnsavedNavigationGuard } from "@/components/shared/unsaved-navigation-guard";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type { Supplier } from "@/features/suppliers/types/supplier.types";
import type { SupplierReceiptCreateAction } from "../types/supplier-receipt.types";
import { useSupplierReceiptCreateForm } from "../hooks/use-supplier-receipt-create-form";
import { calculateSupplierReceiptTotal } from "../services/supplier-receipt-total";
import {
  SupplierReceiptCreateHeader,
  SupplierReceiptSummaryCard,
} from "./supplier-receipt-create-layout";
import {
  SupplierReceiptDeliveryCard,
  SupplierReceiptItemsCard,
} from "./supplier-receipt-create-sections";
import { SupplierReceiptReviewDialog } from "./supplier-receipt-review-dialog";

const decimalText = /^\d+(?:\.\d+)?$/;

export function SupplierReceiptCreatePage({
  suppliers,
  stockItems,
  action,
}: {
  suppliers: Supplier[];
  stockItems: StockItem[];
  action: SupplierReceiptCreateAction;
}) {
  const router = useRouter();
  const hasRequiredOptions = suppliers.length > 0 && stockItems.length > 0;
  const [dirty, setDirty] = useState(false);
  const [recording, setRecording] = useState(false);
  const form = useSupplierReceiptCreateForm({
    suppliers,
    stockItems,
    action,
    onPendingChange: setRecording,
    onDirtyChange: setDirty,
    onCreated: (id) => {
      setDirty(false);
      router.push(`/receipts/${id}`);
    },
  });

  const supplierName =
    suppliers.find((supplier) => supplier.id === form.supplierId)
      ?.supplier_name ?? "Select a supplier";
  const total = form.lines.every(
    (line) =>
      decimalText.test(line.quantity_received) &&
      decimalText.test(line.unit_cost),
  )
    ? calculateSupplierReceiptTotal({
        supplier_id: form.supplierId,
        received_at: form.receivedAt,
        items: form.lines,
      })
    : null;
  const atLineLimit =
    form.lines.length >= 100 || form.lines.length >= stockItems.length;

  const addLine = () => {
    const nextStockItem = stockItems.find(
      (item) => !form.lines.some((line) => line.stock_item_id === item.id),
    );
    form.setLines((current) => [
      ...current,
      {
        key: form.nextLineKey.current++,
        stock_item_id: nextStockItem?.id ?? "",
        quantity_received: "",
        unit_cost: "",
      },
    ]);
    setDirty(true);
  };

  return (
    <form
      onSubmit={form.submit}
      data-coms-ui="operational"
      aria-label="Record supplier delivery"
      className="flex w-full max-w-7xl flex-col gap-6"
    >
      <UnsavedNavigationGuard
        dirty={dirty}
        pending={recording}
        title="Discard delivery details?"
        description="Your unsaved supplier and item entries will be discarded."
      />
      <SupplierReceiptCreateHeader
        pending={recording}
        disabled={!hasRequiredOptions}
      />

      {!hasRequiredOptions && (
        <Alert>
          <InfoIcon />
          <AlertTitle>Delivery setup is incomplete</AlertTitle>
          <AlertDescription>
            Add an active supplier and stock item before recording a supplier
            delivery.
          </AlertDescription>
        </Alert>
      )}
      {form.error && (
        <Alert variant="destructive">
          <AlertTitle>Delivery could not be recorded</AlertTitle>
          <AlertDescription>
            {form.error} Your entries are preserved.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid min-w-0 gap-6 xl:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-3">
          <SupplierReceiptDeliveryCard
            suppliers={suppliers}
            supplierId={form.supplierId}
            receivedAt={form.receivedAt}
            disabled={form.pending || !hasRequiredOptions}
            onSupplierChange={(value) => {
              form.setSupplierId(value);
              setDirty(true);
            }}
            onReceivedAtChange={(value) => {
              form.setReceivedAt(value);
              setDirty(true);
            }}
          />
          <SupplierReceiptItemsCard
            lines={form.lines}
            stockItems={stockItems}
            disabled={form.pending}
            atLineLimit={atLineLimit}
            onChange={form.updateLine}
            onRemove={(key) => {
              form.setLines((current) =>
                current.filter((line) => line.key !== key),
              );
              setDirty(true);
            }}
            onAdd={addLine}
          />
        </div>

        <SupplierReceiptSummaryCard
          supplierName={supplierName}
          receivedAt={form.receivedAt}
          lineCount={form.lines.length}
          total={total}
          pending={recording}
          disabled={!hasRequiredOptions}
        />
      </div>

      <SupplierReceiptReviewDialog
        input={form.reviewInput}
        supplierName={supplierName}
        pending={form.pending}
        onOpenChange={(open) => {
          if (!form.pending && !open) form.setReviewInput(null);
        }}
        onConfirm={form.confirmRecord}
      />
    </form>
  );
}
