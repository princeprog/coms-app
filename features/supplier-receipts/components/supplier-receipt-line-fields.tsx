import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
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
      <FieldDescription>
        Add each stock item once. Enter the quantity received in its listed
        unit.
      </FieldDescription>
      {lines.map((line, index) => (
        <section
          key={line.key}
          aria-label={"Receipt line " + (index + 1)}
          className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-medium text-muted-foreground">
              Item {index + 1}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || lines.length === 1}
              onClick={() => onRemove(line.key)}
              aria-label={"Remove line " + (index + 1)}
            >
              Remove
            </Button>
          </div>
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor={"receipt-stock-item-" + line.key}>
                Stock item<span className="sr-only"> for line {index + 1}</span>
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
                <SelectContent
                  side="bottom"
                  alignItemWithTrigger={false}
                  collisionAvoidance={{
                    side: "none",
                    align: "shift",
                    fallbackAxisSide: "none",
                  }}
                  className="max-h-56"
                  data-coms-ui="operational"
                >
                  <SelectGroup>
                    {stockItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.stock_item_name} ({item.unit})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <FieldGroup className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={"receipt-quantity-" + line.key}>
                  Quantity received
                  <span className="sr-only"> for line {index + 1}</span>
                </FieldLabel>
                <Input
                  id={"receipt-quantity-" + line.key}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  maxLength={80}
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
                  Unit cost
                  <span className="sr-only"> for line {index + 1}</span>
                </FieldLabel>
                <Input
                  id={"receipt-unit-cost-" + line.key}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  maxLength={80}
                  value={line.unit_cost}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(line.key, "unit_cost", event.target.value)
                  }
                  required
                />
              </Field>
            </FieldGroup>
          </FieldGroup>
        </section>
      ))}
    </FieldSet>
  );
}
