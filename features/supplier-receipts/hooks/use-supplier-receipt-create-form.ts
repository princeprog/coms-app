"use client";
import { useRef, useState, type FormEvent } from "react";
import { createSupplierReceiptSchema } from "../schemas/supplier-receipt.schema";
import type {
  CreateSupplierReceipt,
  SupplierReceiptCreateAction,
  SupplierReceiptMutationResult,
} from "../types/supplier-receipt.types";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type { Supplier } from "@/features/suppliers/types/supplier.types";
import type { SupplierReceiptLineValue } from "../components/supplier-receipt-line-fields";
export function useSupplierReceiptCreateForm({
  suppliers,
  stockItems,
  action,
  onPendingChange,
  onDirtyChange,
  onCreated,
}: {
  suppliers: Supplier[];
  stockItems: StockItem[];
  action: SupplierReceiptCreateAction;
  onPendingChange: (value: boolean) => void;
  onDirtyChange: (value: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [reviewInput, setReviewInput] = useState<CreateSupplierReceipt | null>(
    null,
  );
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [receivedAt, setReceivedAt] = useState("");
  const [lines, setLines] = useState<SupplierReceiptLineValue[]>([
    {
      key: 1,
      stock_item_id: stockItems[0]?.id ?? "",
      quantity_received: "",
      unit_cost: "",
    },
  ]);
  const nextLineKey = useRef(2);
  const keyForRetry = useRef<{ fingerprint: string; key: string } | null>(null);

  function updateLine(
    key: number,
    field: "stock_item_id" | "quantity_received" | "unit_cost",
    value: string,
  ) {
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, [field]: value } : line,
      ),
    );
    onDirtyChange(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = createSupplierReceiptSchema.safeParse({
      supplier_id: supplierId,
      received_at: receivedAt,
      items: lines.map(({ stock_item_id, quantity_received, unit_cost }) => ({
        stock_item_id,
        quantity_received: quantity_received.trim(),
        unit_cost: unit_cost.trim(),
      })),
    });
    if (!parsed.success) {
      setError(
        "Choose a supplier and delivery date, then enter unique stock items, positive quantities, and nonnegative unit costs.",
      );
      return;
    }

    setReviewInput(parsed.data);
  }

  async function confirmRecord() {
    if (!reviewInput) return;
    const fingerprint = JSON.stringify(reviewInput);
    if (keyForRetry.current?.fingerprint !== fingerprint) {
      try {
        keyForRetry.current = {
          fingerprint,
          key: globalThis.crypto.randomUUID(),
        };
      } catch {
        setError("This browser cannot safely submit a supplier receipt.");
        return;
      }
    }

    setPending(true);
    onPendingChange(true);
    let result: SupplierReceiptMutationResult;
    try {
      result = await action(reviewInput, keyForRetry.current.key);
    } catch {
      result = {
        ok: false as const,
        error: "COMS could not create this receipt. Try again.",
      };
    }
    setPending(false);
    onPendingChange(false);
    if (!result.ok) {
      setError(result.error);
      setReviewInput(null);
      return;
    }

    keyForRetry.current = null;
    setReviewInput(null);
    onCreated(result.receipt_id);
  }

  return {
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
  };
}
