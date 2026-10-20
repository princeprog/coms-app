"use client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { stockUnitLabel } from "@/features/inventory/stock-unit-label";
import {
  addPurchaseQuantity,
  purchaseAmount,
} from "../services/purchase-totals";
import { PurchaseStockPicker } from "./purchase-stock-picker";
import type { PurchaseLine } from "../hooks/use-purchase-form";

export const PURCHASE_LINE_GRID =
  "sm:grid-cols-[minmax(0,1fr)_8.5rem_8.5rem_6rem_2.75rem]";

function focusById(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

export function PurchaseLineFields({
  line,
  index,
  excluded,
  errors,
  onChange,
  onRemove,
  canRemove,
}: {
  line: PurchaseLine;
  index: number;
  excluded: Set<string>;
  errors: Record<string, string>;
  onChange: (patch: Partial<PurchaseLine>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const prefix = `purchase-line-${line.key}`;
  const stockError = errors[`items.${index}.stock_item_id`];
  const quantityError = errors[`items.${index}.quantity_received`];
  const costError = errors[`items.${index}.unit_cost`];
  const stock = line.stock;
  const amount = purchaseAmount([line]);
  const stockAfter =
    stock?.quantity_on_hand != null
      ? addPurchaseQuantity(stock.quantity_on_hand, line.quantity_received)
      : null;
  const unit = stock ? stockUnitLabel(stock.unit) : "";
  return (
    <div
      role="group"
      aria-label={`Stock item ${index + 1}`}
      className={`grid grid-cols-2 items-start gap-3 border-b border-border/60 py-4 sm:py-3 ${PURCHASE_LINE_GRID}`}
    >
      <Field
        className="col-span-2 min-w-0 sm:col-span-1"
        data-invalid={!!stockError}
      >
        <FieldLabel htmlFor={`${prefix}-stock`} className="sm:sr-only">
          Stock item
        </FieldLabel>
        <PurchaseStockPicker
          id={`${prefix}-stock`}
          selected={stock ?? undefined}
          disabled={false}
          excluded={excluded}
          invalid={!!stockError}
          onSelect={(next) => {
            onChange({ stock: next });
            if (next) focusById(`${prefix}-quantity_received`);
          }}
        />
        {stockError ? (
          <FieldError id={`${prefix}-stock-error`}>{stockError}</FieldError>
        ) : (
          stock?.quantity_on_hand != null && (
            <p className="text-xs text-muted-foreground tabular-nums">
              On hand {stock.quantity_on_hand} {unit}
              {stockAfter && stockAfter !== stock.quantity_on_hand && (
                <>
                  {" → "}
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    {stockAfter}
                  </span>
                </>
              )}
            </p>
          )
        )}
      </Field>
      <Field className="min-w-0" data-invalid={!!quantityError}>
        <FieldLabel
          htmlFor={`${prefix}-quantity_received`}
          className="sm:sr-only"
        >
          Quantity{stock ? ` (${unit})` : ""}
        </FieldLabel>
        <InputGroup className="h-11 bg-background">
          <InputGroupInput
            id={`${prefix}-quantity_received`}
            inputMode="decimal"
            autoComplete="off"
            maxLength={80}
            placeholder="0"
            className="h-full px-3 tabular-nums"
            value={line.quantity_received}
            onChange={(event) =>
              onChange({ quantity_received: event.target.value })
            }
            aria-invalid={!!quantityError}
            aria-describedby={
              quantityError ? `${prefix}-quantity_received-error` : undefined
            }
          />
          {stock && (
            <InputGroupAddon align="inline-end" aria-hidden="true">
              <InputGroupText>{stock.unit}</InputGroupText>
            </InputGroupAddon>
          )}
        </InputGroup>
        {quantityError && (
          <FieldError id={`${prefix}-quantity_received-error`}>
            {quantityError}
          </FieldError>
        )}
      </Field>
      <Field className="min-w-0" data-invalid={!!costError}>
        <FieldLabel htmlFor={`${prefix}-unit_cost`} className="sm:sr-only">
          Unit cost (PHP)
        </FieldLabel>
        <InputGroup className="h-11 bg-background">
          <InputGroupAddon align="inline-start" aria-hidden="true">
            <InputGroupText>₱</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id={`${prefix}-unit_cost`}
            inputMode="decimal"
            autoComplete="off"
            maxLength={80}
            placeholder="0.00"
            className="h-full pr-3 tabular-nums"
            value={line.unit_cost}
            onChange={(event) => onChange({ unit_cost: event.target.value })}
            aria-invalid={!!costError}
            aria-describedby={
              costError ? `${prefix}-unit_cost-error` : undefined
            }
          />
        </InputGroup>
        {costError && (
          <FieldError id={`${prefix}-unit_cost-error`}>{costError}</FieldError>
        )}
      </Field>
      <div className="col-span-2 flex items-center justify-between gap-3 sm:contents">
        <p className="flex min-h-11 items-center justify-end text-sm font-medium tabular-nums sm:text-right">
          <span className="mr-2 text-xs font-normal text-muted-foreground sm:sr-only">
            Amount
          </span>
          {amount ? (
            <>₱{amount}</>
          ) : (
            <span className="text-muted-foreground" aria-label="Not calculated">
              —
            </span>
          )}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 text-muted-foreground hover:text-destructive"
          disabled={!canRemove}
          aria-label={`Remove stock item ${index + 1}`}
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
