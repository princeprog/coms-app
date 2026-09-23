import { Input } from "@/components/ui/input";
import type { Dispatch } from "@/features/dispatches/types/dispatch.types";

export function DispatchQuantityFields({
  items,
  quantities,
  quantityVerb,
  disabled,
  onQuantityChange,
}: {
  items: Dispatch["items"];
  quantities: Record<string, string>;
  quantityVerb: "received" | "shortage closed";
  disabled: boolean;
  onQuantityChange: (itemId: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const inputId = `dispatch-quantity-${quantityVerb.replaceAll(" ", "-")}-${item.id}`;
        const hintId = `${inputId}-hint`;
        return (
          <div key={item.id} className="flex flex-col gap-2">
            <label className="font-medium" htmlFor={inputId}>
              {item.stock_item_name} {quantityVerb} ({item.unit})
            </label>
            <p id={hintId} className="text-sm text-muted-foreground">
              {item.quantity_in_transit} {item.unit} currently in transit
            </p>
            <Input
              id={inputId}
              aria-describedby={hintId}
              autoComplete="off"
              inputMode="decimal"
              disabled={disabled}
              value={quantities[item.id] ?? ""}
              onChange={(event) =>
                onQuantityChange(item.id, event.target.value)
              }
            />
          </div>
        );
      })}
    </div>
  );
}
