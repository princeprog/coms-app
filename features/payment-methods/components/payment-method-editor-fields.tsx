import { Banknote, CircleCheck, CirclePause, CreditCard } from "lucide-react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function PaymentMethodEditorFields({
  values,
  pending,
  onChange,
}: {
  values: Record<string, string>;
  pending: boolean;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="payment-method-name">
          Payment method name
        </FieldLabel>
        <Input
          id="payment-method-name"
          value={values.name ?? ""}
          placeholder="e.g. Cash, GCash, Credit card"
          maxLength={40}
          required
          autoFocus
          disabled={pending}
          onChange={(event) => onChange("name", event.target.value)}
        />
        <FieldDescription>
          Cashiers will see this exact name when selecting payment at checkout.
        </FieldDescription>
      </Field>

      <FieldSet>
        <FieldLegend>Payment behavior</FieldLegend>
        <FieldDescription>
          This controls whether POS asks for an amount received and calculates
          change.
        </FieldDescription>
        <RadioGroup
          value={values.kind ?? ""}
          disabled={pending}
          className="grid gap-3 sm:grid-cols-2"
          onValueChange={(value) => onChange("kind", value ?? "")}
        >
          <FieldLabel className="min-h-28 cursor-pointer">
            <Field orientation="horizontal">
              <RadioGroupItem value="CASH" />
              <Banknote
                aria-hidden="true"
                className="size-5 stroke-emerald-700 dark:stroke-emerald-400"
              />
              <FieldContent>
                <FieldTitle>Cash</FieldTitle>
                <FieldDescription>
                  Ask for amount received and show the customer&apos;s change.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
          <FieldLabel className="min-h-28 cursor-pointer">
            <Field orientation="horizontal">
              <RadioGroupItem value="NON_CASH" />
              <CreditCard
                aria-hidden="true"
                className="size-5 stroke-blue-600 dark:stroke-blue-400"
              />
              <FieldContent>
                <FieldTitle>Non-cash</FieldTitle>
                <FieldDescription>
                  Record the selected method without asking for cash received.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
        </RadioGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Availability</FieldLegend>
        <RadioGroup
          value={values.status ?? ""}
          disabled={pending}
          className="grid gap-3 sm:grid-cols-2"
          onValueChange={(value) => onChange("status", value ?? "")}
        >
          <FieldLabel className="cursor-pointer">
            <Field orientation="horizontal">
              <RadioGroupItem value="enabled" />
              <CircleCheck
                aria-hidden="true"
                className="size-5 stroke-emerald-700 dark:stroke-emerald-400"
              />
              <FieldContent>
                <FieldTitle>Active</FieldTitle>
                <FieldDescription>
                  Available in POS immediately.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
          <FieldLabel className="cursor-pointer">
            <Field orientation="horizontal">
              <RadioGroupItem value="disabled" />
              <CirclePause
                aria-hidden="true"
                className="size-5 stroke-amber-600 dark:stroke-amber-400"
              />
              <FieldContent>
                <FieldTitle>Inactive</FieldTitle>
                <FieldDescription>
                  Hidden from POS while remaining in sales history.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
        </RadioGroup>
      </FieldSet>
    </div>
  );
}
