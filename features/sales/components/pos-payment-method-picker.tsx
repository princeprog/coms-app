import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentMethodChoice } from "@/features/payment-methods/schemas/payment-method.schema";
export function PosPaymentMethodPicker({
  methods,
  selected,
  loading,
  failed,
  disabled,
  onSelect,
  onRefresh,
}: {
  methods: PaymentMethodChoice[];
  selected: PaymentMethodChoice | null;
  loading: boolean;
  failed: boolean;
  disabled: boolean;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}) {
  const missing = selected && !methods.some((item) => item.id === selected.id);
  return (
    <Field aria-busy={loading}>
      <FieldLabel htmlFor="pos-payment-method">Payment method</FieldLabel>
      <Select
        value={selected?.id ?? ""}
        onValueChange={(value) => {
          if (value) onSelect(value);
        }}
        disabled={disabled || loading || failed || !methods.length}
      >
        <SelectTrigger id="pos-payment-method" className="w-full">
          <SelectValue>
            {() =>
              loading
                ? "Loading payment methods…"
                : selected
                  ? `${selected.name}${missing ? " — unavailable" : ""}`
                  : "Select payment method"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {missing && (
            <SelectItem value={selected.id} disabled>
              {selected.name} — unavailable
            </SelectItem>
          )}
          {methods.map((method) => (
            <SelectItem key={method.id} value={method.id}>
              {method.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          Unable to load payment methods. Your order is preserved.
        </p>
      ) : !loading && !methods.length ? (
        <p role="status" className="text-sm text-muted-foreground">
          No payment methods are enabled. Ask an administrator to enable one.
        </p>
      ) : missing ? (
        <p role="alert" className="text-sm text-destructive">
          This method is no longer accepted. Choose another method.
        </p>
      ) : null}
      {(failed || (!loading && !methods.length)) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={disabled}
        >
          Reload payment methods
        </Button>
      )}
    </Field>
  );
}
