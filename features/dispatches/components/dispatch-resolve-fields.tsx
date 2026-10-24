import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { VarianceLine } from "@/features/dispatches/services/dispatch-detail-presentation";
import type { DispatchResolutionOutcome } from "@/features/dispatches/types/dispatch.types";
import { DispatchShortageReasonField } from "./dispatch-shortage-reason-field";

const shortageOutcomes = [
  {
    value: "NOT_LOADED",
    label: "Not loaded",
    description:
      "Stock stayed at the commissary. Add it back to commissary inventory.",
  },
  {
    value: "LOST",
    label: "Lost",
    description:
      "Stock left the commissary but did not arrive. Record it as a loss.",
  },
] as const;

export function DispatchResolveFields({
  dispatchId,
  lines,
  line,
  outcome,
  quantity,
  reason,
  disabled,
  errors,
  onLineChange,
  onOutcomeChange,
  onQuantityChange,
  onReasonChange,
}: {
  dispatchId: string;
  lines: VarianceLine[];
  line: VarianceLine;
  outcome: DispatchResolutionOutcome | "";
  quantity: string;
  reason: string;
  disabled: boolean;
  errors: { outcome?: string; quantity?: string; reason?: string };
  onLineChange: (itemId: string) => void;
  onOutcomeChange: (outcome: DispatchResolutionOutcome) => void;
  onQuantityChange: (quantity: string) => void;
  onReasonChange: (reason: string) => void;
}) {
  const lineId = `resolve-line-${dispatchId}`;
  const quantityId = `resolve-quantity-${dispatchId}`;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field className="min-w-0 sm:col-span-2">
          <FieldLabel htmlFor={lineId}>Stock item</FieldLabel>
          <NativeSelect
            id={lineId}
            className="w-full [&_select]:h-10"
            disabled={disabled}
            value={line.item.id}
            onChange={(event) => onLineChange(event.target.value)}
          >
            {lines.map((candidate) => (
              <NativeSelectOption
                key={candidate.item.id}
                value={candidate.item.id}
              >
                {candidate.item.stock_item_name}: {candidate.amount}{" "}
                {candidate.item.unit}{" "}
                {candidate.direction === "short" ? "short" : "over"}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field data-invalid={!!errors.quantity}>
          <FieldLabel htmlFor={quantityId}>
            Quantity ({line.item.unit})
          </FieldLabel>
          <Input
            className="h-10"
            id={quantityId}
            aria-required="true"
            aria-invalid={!!errors.quantity}
            aria-describedby={`${quantityId}-hint${errors.quantity ? ` ${quantityId}-error` : ""}`}
            inputMode="decimal"
            autoComplete="off"
            maxLength={80}
            disabled={disabled}
            value={quantity}
            onChange={(event) => onQuantityChange(event.target.value)}
          />
          <FieldDescription id={`${quantityId}-hint`}>
            {line.amount} {line.item.unit} unresolved.
          </FieldDescription>
          {errors.quantity && (
            <FieldError id={`${quantityId}-error`}>
              {errors.quantity}
            </FieldError>
          )}
        </Field>
      </div>
      {line.direction === "short" ? (
        <FieldSet>
          <FieldLegend id={`${lineId}-outcome-label`} variant="label">
            What happened to the missing stock?
          </FieldLegend>
          <RadioGroup
            aria-labelledby={`${lineId}-outcome-label`}
            aria-required="true"
            aria-invalid={!!errors.outcome}
            aria-describedby={
              errors.outcome ? `${lineId}-outcome-error` : undefined
            }
            value={outcome}
            disabled={disabled}
            onValueChange={(value) =>
              onOutcomeChange(value as DispatchResolutionOutcome)
            }
          >
            {shortageOutcomes.map((option) => (
              <Field
                key={option.value}
                orientation="horizontal"
                className="rounded-lg border p-3 has-data-checked:border-primary/50 has-data-checked:bg-primary/5"
              >
                <RadioGroupItem
                  value={option.value}
                  id={`${lineId}-${option.value}`}
                />
                <FieldLabel
                  htmlFor={`${lineId}-${option.value}`}
                  className="cursor-pointer flex-col items-start gap-1"
                >
                  <span>{option.label}</span>
                  <span className="text-sm leading-relaxed font-normal text-muted-foreground">
                    {option.description}
                  </span>
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
          {errors.outcome && (
            <FieldError id={`${lineId}-outcome-error`}>
              {errors.outcome}
            </FieldError>
          )}
        </FieldSet>
      ) : (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-sm leading-relaxed">
          <span className="mb-1 block font-medium">Confirm surplus</span>
          The branch counted more than was sent. Confirming the surplus deducts
          it from commissary stock. If this leaves the balance below zero, it
          will be marked Below zero in Inventory for a stock-record correction.
        </p>
      )}
      <DispatchShortageReasonField
        dispatchId={dispatchId}
        reason={reason}
        disabled={disabled}
        error={errors.reason}
        onReasonChange={onReasonChange}
      />
    </>
  );
}
