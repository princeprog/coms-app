import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
    <FieldGroup className="gap-4">
      {items.map((item) => {
        const inputId = `dispatch-quantity-${quantityVerb.replaceAll(" ", "-")}-${item.id}`;
        const hintId = `${inputId}-hint`;
        return (
          <Field key={item.id} className="rounded-lg border bg-card p-4">
            <FieldLabel htmlFor={inputId}>
              {item.stock_item_name} {quantityVerb} ({item.unit})
            </FieldLabel>
            <FieldDescription id={hintId}>
              {item.quantity_in_transit} {item.unit} currently in transit
            </FieldDescription>
            <Input
              id={inputId}
              type="text"
              aria-describedby={hintId}
              autoComplete="off"
              inputMode="decimal"
              maxLength={80}
              disabled={disabled}
              value={quantities[item.id] ?? ""}
              onChange={(event) =>
                onQuantityChange(item.id, event.target.value)
              }
            />
          </Field>
        );
      })}
    </FieldGroup>
  );
}
