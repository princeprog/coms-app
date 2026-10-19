"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
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
  quantityErrors = {},
  onStockSelect,
  disabled,
  availabilityVisible,
  onChange,
  onRemove,
  onAdd,
}: {
  lines: DispatchCreateLine[];
  quantityErrors?: Record<number, string>;
  onStockSelect: (key: number, stock: DispatchStockOption | null) => void;
  disabled: boolean;
  availabilityVisible: boolean;
  onChange: (
    key: number,
    field: "stock_item_id" | "quantity_dispatched",
    value: string,
  ) => void;
  onRemove: (key: number) => void;
  onAdd?: () => void;
}) {
  return (
    <FieldSet className="gap-3" aria-labelledby="dispatch-lines-heading">
      <FieldLegend
        id="dispatch-lines-heading"
        variant="label"
        className="sr-only"
      >
        Stock items
      </FieldLegend>
      <div>
        <div
          aria-hidden="true"
          className="hidden grid-cols-[minmax(0,1fr)_9rem_2.5rem] items-center gap-3 pb-2 text-sm font-medium sm:grid"
        >
          <span>Stock item</span>
          <span>Quantity</span>
          <span className="sr-only">Remove</span>
        </div>
        {lines.map((line, index) => {
          const stockItem = line.stock;
          const selectedByAnotherLine = new Set(
            lines
              .filter((other) => other.key !== line.key)
              .map((other) => other.stock_item_id),
          );
          return (
            <FieldGroup
              key={line.key}
              className="relative grid gap-3 border-b border-border/60 py-4 pr-12 first:pt-0 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_9rem_2.5rem] sm:items-start sm:py-3 sm:pr-0 sm:nth-2:pt-0"
            >
              <Field className="min-w-0">
                <FieldLabel
                  htmlFor={`dispatch-item-${line.key}`}
                  className="sm:sr-only"
                >
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
              <Field
                className="min-w-0"
                data-invalid={!!quantityErrors[line.key]}
              >
                <FieldLabel
                  htmlFor={`dispatch-quantity-${line.key}`}
                  className="sm:sr-only"
                >
                  Quantity{stockItem ? ` (${stockItem.unit})` : ""}
                </FieldLabel>
                <InputGroup className="h-10 bg-background">
                  <InputGroupInput
                    id={`dispatch-quantity-${line.key}`}
                    type="text"
                    inputMode="decimal"
                    maxLength={80}
                    placeholder="0.00"
                    className="h-full px-3 tabular-nums"
                    value={line.quantity_dispatched}
                    disabled={disabled}
                    aria-invalid={!!quantityErrors[line.key]}
                    onChange={(event) =>
                      onChange(
                        line.key,
                        "quantity_dispatched",
                        event.target.value,
                      )
                    }
                    aria-describedby={
                      quantityErrors[line.key]
                        ? `dispatch-quantity-error-${line.key}`
                        : availabilityVisible &&
                            stockItem?.quantity_on_hand != null
                          ? `dispatch-quantity-help-${line.key}`
                          : undefined
                    }
                  />
                  {stockItem && (
                    <InputGroupAddon align="inline-end" aria-hidden="true">
                      <InputGroupText>{stockItem.unit}</InputGroupText>
                    </InputGroupAddon>
                  )}
                </InputGroup>
                {quantityErrors[line.key] ? (
                  <p
                    id={`dispatch-quantity-error-${line.key}`}
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {quantityErrors[line.key]}
                  </p>
                ) : (
                  availabilityVisible &&
                  stockItem?.quantity_on_hand != null && (
                    <span
                      id={`dispatch-quantity-help-${line.key}`}
                      className="text-xs text-muted-foreground"
                    >
                      Available: {stockItem.quantity_on_hand} {stockItem.unit}
                    </span>
                  )
                )}
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-4 right-0 size-10 text-muted-foreground hover:text-destructive sm:static"
                disabled={disabled || lines.length === 1}
                aria-label={`Remove stock item ${index + 1}`}
                onClick={() => onRemove(line.key)}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </FieldGroup>
          );
        })}
      </div>
      {onAdd && (
        <Button
          type="button"
          variant="ghost"
          className="min-h-10 w-fit gap-2 px-2 text-primary hover:text-primary"
          disabled={disabled || lines.length >= 100}
          onClick={onAdd}
        >
          <PlusIcon data-icon="inline-start" />
          Add stock item
        </Button>
      )}
    </FieldSet>
  );
}
