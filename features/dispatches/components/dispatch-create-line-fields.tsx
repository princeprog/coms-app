"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DispatchStockPicker } from "./dispatch-stock-picker";
import type { DispatchStockOption } from "../types/dispatch.types";

export type DispatchCreateLine = {
  key: number;
  stock_item_id: string;
  quantity_dispatched: string;
  stock?: DispatchStockOption;
};

export function DispatchCreateLineFields({
  lines,
  onStockSelect,
  disabled,
  availabilityVisible,
  onChange,
  onRemove,
}: {
  lines: DispatchCreateLine[];
  onStockSelect: (key: number, stock: DispatchStockOption | null) => void;
  disabled: boolean;
  availabilityVisible: boolean;
  onChange: (
    key: number,
    field: "stock_item_id" | "quantity_dispatched",
    value: string,
  ) => void;
  onRemove: (key: number) => void;
}) {
  return (
    <div className="space-y-4" aria-labelledby="dispatch-lines-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id="dispatch-lines-heading" className="text-sm font-semibold">
            Stock items
          </h3>
          <p className="text-sm text-muted-foreground">
            Add each stock item once and enter the quantity to send.
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {lines.length} / 100
        </span>
      </div>
      {lines.map((line, index) => {
        const stockItem = line.stock;
        const selectedByAnotherLine = new Set(
          lines
            .filter((other) => other.key !== line.key)
            .map((other) => other.stock_item_id),
        );
        return (
          <div
            key={line.key}
            className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(9rem,1fr)_auto] sm:items-end"
          >
            <Field className="min-w-0">
              <FieldLabel htmlFor={`dispatch-item-${line.key}`}>
                Stock item {index + 1}
              </FieldLabel>
              <DispatchStockPicker
                id={`dispatch-item-${line.key}`}
                selected={line.stock}
                disabled={disabled}
                availabilityVisible={availabilityVisible}
                excluded={selectedByAnotherLine}
                onSelect={(stock) => onStockSelect(line.key, stock)}
              />
            </Field>
            <Field className="min-w-0">
              <FieldLabel htmlFor={`dispatch-quantity-${line.key}`}>
                Quantity{stockItem ? ` (${stockItem.unit})` : ""}
              </FieldLabel>
              <Input
                id={`dispatch-quantity-${line.key}`}
                type="text"
                inputMode="decimal"
                maxLength={80}
                placeholder="0.00"
                value={line.quantity_dispatched}
                disabled={disabled}
                onChange={(event) =>
                  onChange(line.key, "quantity_dispatched", event.target.value)
                }
                aria-describedby={`dispatch-quantity-help-${line.key}`}
              />
              <span
                id={`dispatch-quantity-help-${line.key}`}
                className="text-xs text-muted-foreground"
              >
                {availabilityVisible && stockItem?.quantity_on_hand != null
                  ? `Available: ${stockItem.quantity_on_hand} ${stockItem.unit}. Checked again when sending.`
                  : "Enter a positive decimal quantity."}
              </span>
            </Field>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || lines.length === 1}
              aria-label={`Remove stock item ${index + 1}`}
              onClick={() => onRemove(line.key)}
            >
              Remove
            </Button>
          </div>
        );
      })}
    </div>
  );
}
