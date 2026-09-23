import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";

export type SupplierReceiptLineValue = {
  key: number;
  stock_item_id: string;
  quantity_received: string;
  unit_cost: string;
};

export function SupplierReceiptLineFields({
  lines,
  stockItems,
  disabled,
  onChange,
  onRemove,
}: {
  lines: SupplierReceiptLineValue[];
  stockItems: StockItem[];
  disabled: boolean;
  onChange: (
    key: number,
    field: "stock_item_id" | "quantity_received" | "unit_cost",
    value: string,
  ) => void;
  onRemove: (key: number) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-sm font-medium">Received items</legend>
      {lines.map((line, index) => (
        <div key={line.key} className="grid gap-3 rounded-3xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Line {index + 1}</p>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || lines.length === 1}
              onClick={() => onRemove(line.key)}
              aria-label={`Remove line ${index + 1}`}
            >
              Remove
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor={`receipt-stock-item-${line.key}`}
              className="text-sm"
            >
              Stock item for line {index + 1}
            </label>
            <select
              id={`receipt-stock-item-${line.key}`}
              value={line.stock_item_id}
              disabled={disabled}
              onChange={(event) =>
                onChange(line.key, "stock_item_id", event.target.value)
              }
              className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.stock_item_name} ({item.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`receipt-quantity-${line.key}`}
                className="text-sm"
              >
                Quantity received for line {index + 1}
              </label>
              <Input
                id={`receipt-quantity-${line.key}`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={line.quantity_received}
                disabled={disabled}
                onChange={(event) =>
                  onChange(line.key, "quantity_received", event.target.value)
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`receipt-unit-cost-${line.key}`}
                className="text-sm"
              >
                Unit cost for line {index + 1}
              </label>
              <Input
                id={`receipt-unit-cost-${line.key}`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={line.unit_cost}
                disabled={disabled}
                onChange={(event) =>
                  onChange(line.key, "unit_cost", event.target.value)
                }
                required
              />
            </div>
          </div>
        </div>
      ))}
    </fieldset>
  );
}
