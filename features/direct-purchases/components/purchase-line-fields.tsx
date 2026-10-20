import { purchaseAmount } from "../services/purchase-totals";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { stockUnitLabel } from "@/features/inventory/stock-unit-label";
import { PurchaseStockPicker } from "./purchase-stock-picker";
import type { PurchaseLine } from "../hooks/use-purchase-form";
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
  return (
    <div className="grid grid-cols-2 items-start gap-3 rounded-lg border p-4 sm:grid-cols-12">
      <Field className="col-span-2 sm:col-span-5" data-invalid={!!stockError}>
        <FieldLabel htmlFor={`${prefix}-stock`}>Stock item</FieldLabel>
        <PurchaseStockPicker
          id={`${prefix}-stock`}
          selected={line.stock ?? undefined}
          disabled={false}
          excluded={excluded}
          invalid={!!stockError}
          onSelect={(stock) => onChange({ stock })}
        />
        {stockError && (
          <FieldError id={`${prefix}-stock-error`}>{stockError}</FieldError>
        )}
      </Field>
      {(["quantity_received", "unit_cost"] as const).map((name) => {
        const error = errors[`items.${index}.${name}`];
        const id = `${prefix}-${name}`;
        return (
          <Field key={name} className="sm:col-span-3" data-invalid={!!error}>
            <FieldLabel htmlFor={id}>
              {name === "unit_cost"
                ? "Unit cost (PHP)"
                : `Quantity${line.stock ? " (" + stockUnitLabel(line.stock.unit) + ")" : ""}`}
            </FieldLabel>
            <Input
              id={id}
              inputMode="decimal"
              autoComplete="off"
              value={line[name]}
              onChange={(event) => onChange({ [name]: event.target.value })}
              className="h-11"
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
          </Field>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="col-span-2 justify-self-end sm:col-span-1 sm:mt-7"
        disabled={!canRemove}
        aria-label={`Remove stock item ${index + 1}`}
        onClick={onRemove}
      >
        <Trash2 aria-hidden="true" />
      </Button>
      <p className="col-span-2 text-right text-xs text-muted-foreground tabular-nums sm:col-span-12">
        Amount (PHP): {purchaseAmount([line]) ?? "—"}
      </p>
    </div>
  );
}
