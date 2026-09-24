import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <FieldSet className="gap-4">
      <FieldLegend variant="label">Received items</FieldLegend>
      {lines.map((line, index) => (
        <section
          key={line.key}
          aria-label={"Receipt line " + (index + 1)}
          className="grid gap-4 rounded-lg border bg-card p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">Line {index + 1}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || lines.length === 1}
              onClick={() => onRemove(line.key)}
              aria-label={"Remove line " + (index + 1)}
            >
              Remove
            </Button>
          </div>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor={"receipt-stock-item-" + line.key}>
                Stock item for line {index + 1}
              </FieldLabel>
              <Select
                value={line.stock_item_id}
                disabled={disabled}
                onValueChange={(value) =>
                  onChange(line.key, "stock_item_id", value ?? "")
                }
              >
                <SelectTrigger
                  id={"receipt-stock-item-" + line.key}
                  className="w-full"
                >
                  <SelectValue>
                    {(value: unknown) => {
                      const item = stockItems.find(
                        (entry) => entry.id === value,
                      );
                      return item
                        ? item.stock_item_name + " (" + item.unit + ")"
                        : "Select an item";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent data-coms-ui="operational">
                  {stockItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.stock_item_name} ({item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={"receipt-quantity-" + line.key}>
                  Quantity received for line {index + 1}
                </FieldLabel>
                <Input
                  id={"receipt-quantity-" + line.key}
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
              </Field>
              <Field>
                <FieldLabel htmlFor={"receipt-unit-cost-" + line.key}>
                  Unit cost for line {index + 1}
                </FieldLabel>
                <Input
                  id={"receipt-unit-cost-" + line.key}
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
              </Field>
            </div>
          </FieldGroup>
        </section>
      ))}
    </FieldSet>
  );
}
