import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import type { DispatchItem } from "@/features/dispatches/types/dispatch.types";

export function DispatchQuantityFields({
  items,
  quantities,
  disabled,
  onQuantityChange,
}: {
  items: DispatchItem[];
  quantities: Record<string, string>;
  disabled: boolean;
  onQuantityChange: (itemId: string, value: string) => void;
}) {
  return (
    <FieldSet className="gap-3">
      <FieldLegend className="mb-0 text-sm">Items received</FieldLegend>
      <p className="-mt-1 text-xs text-muted-foreground">
        Enter your count. Use 0 for missing items.
      </p>
      <FieldGroup className="gap-0 overflow-hidden rounded-xl border">
        <div
          aria-hidden="true"
          className="hidden items-center justify-between border-b bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground @xs/field-group:flex"
        >
          <span>Stock item</span>
          <span className="w-32 text-right">Received</span>
        </div>
        {items.map((item) => {
          const inputId = `dispatch-count-${item.id}`;
          return (
            <Field
              key={item.id}
              orientation="horizontal"
              data-disabled={disabled}
              className="flex-col items-stretch gap-2 border-b px-4 py-4 last:border-b-0 @xs/field-group:flex-row @xs/field-group:items-center @xs/field-group:gap-6"
            >
              <FieldLabel htmlFor={inputId} className="min-w-0 wrap-anywhere">
                {item.stock_item_name}
                <span className="sr-only"> counted ({item.unit})</span>
              </FieldLabel>
              <InputGroup className="h-12 rounded-lg bg-background @xs/field-group:w-32 @xs/field-group:shrink-0">
                <InputGroupInput
                  id={inputId}
                  type="text"
                  aria-required="true"
                  autoComplete="off"
                  inputMode="decimal"
                  maxLength={80}
                  className="h-full px-3 text-right tabular-nums"
                  disabled={disabled}
                  value={quantities[item.id] ?? ""}
                  onChange={(event) =>
                    onQuantityChange(item.id, event.target.value)
                  }
                />
                <InputGroupAddon align="inline-end" aria-hidden="true">
                  <InputGroupText>{item.unit}</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          );
        })}
      </FieldGroup>
    </FieldSet>
  );
}
