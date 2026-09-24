import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
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

export type StockRequestLineValue = {
  key: number;
  stock_item_id: string;
  quantity_requested: string;
};

export function StockRequestLineFields({
  lines,
  stockItems,
  disabled,
  onChange,
  onRemove,
}: {
  lines: StockRequestLineValue[];
  stockItems: StockItem[];
  disabled: boolean;
  onChange: (
    key: number,
    field: "stock_item_id" | "quantity_requested",
    value: string,
  ) => void;
  onRemove: (key: number) => void;
}) {
  return (
    <FieldSet className="gap-4">
      <FieldLegend variant="label">Requested items</FieldLegend>
      {lines.map((line, index) => (
        <section
          key={line.key}
          aria-label={"Request line " + (index + 1)}
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
              <FieldLabel htmlFor={"request-stock-item-" + line.key}>
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
                  id={"request-stock-item-" + line.key}
                  className="w-full"
                >
                  <SelectValue>
                    {(value: unknown) => {
                      const item = stockItems.find(
                        (entry) => entry.id === value,
                      );
                      return item
                        ? item.stock_item_name + " (" + item.unit + ")"
                        : "Select a stock item";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent data-coms-ui="operational">
                  {stockItems.map((item) => {
                    const usedElsewhere = lines.some(
                      (other) =>
                        other.key !== line.key &&
                        other.stock_item_id === item.id,
                    );
                    return (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                        disabled={usedElsewhere}
                      >
                        {item.stock_item_name} ({item.unit})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor={"request-quantity-" + line.key}>
                Quantity {index + 1}
              </FieldLabel>
              <Input
                id={"request-quantity-" + line.key}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                maxLength={80}
                value={line.quantity_requested}
                disabled={disabled}
                onChange={(event) =>
                  onChange(line.key, "quantity_requested", event.target.value)
                }
                required
              />
            </Field>
          </FieldGroup>
        </section>
      ))}
    </FieldSet>
  );
}
