import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { formatProductPrice } from "@/lib/format-currency";
import { calculateCashChange } from "../services/pos-cash";

export function PosCashPayment({
  amount,
  total,
  disabled,
  onChange,
}: {
  amount: string;
  total: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const { change, shortfall } = calculateCashChange(amount, total);
  const invalid = Boolean(amount) && change === null;
  return (
    <section className="flex flex-col gap-3" aria-label="Cash payment">
      <h3 className="text-lg font-semibold">Cash payment</h3>
      <Field data-invalid={invalid}>
        <FieldLabel htmlFor="pos-amount-received">Amount received</FieldLabel>
        <InputGroup className="h-16">
          <InputGroupAddon>₱</InputGroupAddon>
          <InputGroupInput
            id="pos-amount-received"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            maxLength={60}
            disabled={disabled}
            className="text-2xl font-semibold tabular-nums md:text-2xl"
            aria-invalid={invalid}
            aria-describedby="pos-cash-feedback"
            onChange={(event) => onChange(event.target.value)}
          />
        </InputGroup>
      </Field>
      <div className="grid grid-cols-3 gap-2" aria-label="Cash shortcuts">
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={disabled || total === null}
          onClick={() => onChange(total ?? "")}
        >
          Exact amount
        </Button>
        {["500", "1000"].map((value) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            className="h-11"
            disabled={disabled}
            onClick={() => onChange(value)}
          >
            {formatProductPrice(value)}
          </Button>
        ))}
      </div>
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-800 p-5 text-white"
        aria-live="polite"
        aria-atomic="true"
      >
        <div>
          <p className="font-medium">Change due</p>
          <p className="mt-1 text-xs text-zinc-300">Return to customer</p>
        </div>
        <output
          aria-label="Change due"
          className="break-all text-3xl font-semibold tracking-tight tabular-nums"
        >
          {change !== null ? formatProductPrice(change) : "—"}
        </output>
      </div>
      <p
        id="pos-cash-feedback"
        className={
          invalid ? "text-sm text-destructive" : "text-xs text-muted-foreground"
        }
      >
        {shortfall !== null
          ? `Amount received is short by ${formatProductPrice(shortfall)}.`
          : invalid
            ? "Enter a valid amount, for example 1000.00."
            : "Confirm cash received before completing the sale."}
      </p>
    </section>
  );
}
