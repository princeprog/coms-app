"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetFooter } from "@/components/ui/sheet";
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
    onDirtyChange(true);
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
    <form
      onSubmit={submit}
      className="flex min-h-0 flex-1 flex-col"
      aria-label="Create supplier receipt"
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="receipt-supplier">Supplier</FieldLabel>
            <Select
              value={supplierId}
              disabled={pending}
              onValueChange={(value) => {
                setSupplierId(value ?? "");
                onDirtyChange(true);
              }}
            >
              <SelectTrigger id="receipt-supplier" className="w-full">
                <SelectValue>
                  {(value: unknown) =>
                    suppliers.find((supplier) => supplier.id === value)
                      ?.supplier_name ?? "Select a supplier"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent data-coms-ui="operational">
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.supplier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="receipt-date">Received date</FieldLabel>
            <Input
              id="receipt-date"
              type="date"
              value={receivedAt}
              disabled={pending}
              onChange={(event) => {
                setReceivedAt(event.target.value);
                onDirtyChange(true);
              }}
              required
            />
          </Field>
        </FieldGroup>
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
            onDirtyChange(true);
          }}
        >
          Add stock item
        </Button>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <FieldDescription>
          Stock is unchanged until an authorized user posts the saved draft.
        </FieldDescription>
      </div>
      <SheetFooter className="flex-row justify-end border-t bg-background p-4 sm:p-6">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving draft…" : "Save draft"}
        </Button>
      </SheetFooter>
    </form>
  );
}
