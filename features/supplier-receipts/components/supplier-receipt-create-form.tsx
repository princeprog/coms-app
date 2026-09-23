"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createSupplierReceiptSchema } from "@/features/supplier-receipts/schemas/supplier-receipt.schema";
import type {
  SupplierReceiptCreateAction,
  SupplierReceiptMutationResult,
} from "@/features/supplier-receipts/types/supplier-receipt.types";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type { Supplier } from "@/features/suppliers/types/supplier.types";
import {
  SupplierReceiptLineFields,
  type SupplierReceiptLineValue,
} from "./supplier-receipt-line-fields";

export function SupplierReceiptCreateForm({
  suppliers,
  stockItems,
  action,
  onPendingChange,
  onCreated,
}: {
  suppliers: Supplier[];
  stockItems: StockItem[];
  action: SupplierReceiptCreateAction;
  onPendingChange: (pending: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
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
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
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
        "Enter a receipt date, positive quantities, and valid unit costs.",
      );
      return;
    }

    const fingerprint = JSON.stringify(parsed.data);
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
      result = await action(parsed.data, keyForRetry.current.key);
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
      return;
    }

    keyForRetry.current = null;
    onCreated(result.receipt_id);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="receipt-supplier" className="text-sm font-medium">
            Supplier
          </label>
          <select
            id="receipt-supplier"
            value={supplierId}
            disabled={pending}
            onChange={(event) => setSupplierId(event.target.value)}
            className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.supplier_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="receipt-date" className="text-sm font-medium">
            Received date
          </label>
          <Input
            id="receipt-date"
            type="date"
            value={receivedAt}
            disabled={pending}
            onChange={(event) => setReceivedAt(event.target.value)}
            required
          />
        </div>
      </div>
      <SupplierReceiptLineFields
        lines={lines}
        stockItems={stockItems}
        disabled={pending}
        onChange={updateLine}
        onRemove={(key) =>
          setLines((current) => current.filter((line) => line.key !== key))
        }
      />
      <div>
        <Button
          type="button"
          variant="outline"
          disabled={pending || lines.length >= 100}
          onClick={() => {
            setLines((current) => [
              ...current,
              {
                key: nextLineKey.current++,
                stock_item_id: stockItems[0]?.id ?? "",
                quantity_received: "",
                unit_cost: "",
              },
            ]);
          }}
        >
          Add stock item
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving draft…" : "Save draft"}
        </Button>
      </DialogFooter>
    </form>
  );
}
