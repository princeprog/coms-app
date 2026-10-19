import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { VarianceLine } from "@/features/dispatches/services/dispatch-detail-presentation";
import type { DispatchResolutionOutcome } from "@/features/dispatches/types/dispatch.types";
import { DispatchShortageReasonField } from "./dispatch-shortage-reason-field";

const shortageOutcomes = [
  {
    value: "NOT_LOADED",
    label: "Not loaded",
    description: "The stock never left the commissary. It is added back to commissary stock.",
  },
  {
    value: "LOST",
    label: "Lost",
    description: "The stock left the commissary but never arrived. It is written off.",
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
  onLineChange: (itemId: string) => void;
  onOutcomeChange: (outcome: DispatchResolutionOutcome) => void;
  onQuantityChange: (quantity: string) => void;
  onReasonChange: (reason: string) => void;
}) {
  const lineId = `resolve-line-${dispatchId}`;
  const quantityId = `resolve-quantity-${dispatchId}`;
  return (
    <>
      <Field>
        <FieldLabel htmlFor={lineId}>Stock item</FieldLabel>
        <NativeSelect
          id={lineId}
          className="w-full"
          disabled={disabled}
          value={line.item.id}
          onChange={(event) => onLineChange(event.target.value)}
        >
          {lines.map((candidate) => (
            <NativeSelectOption key={candidate.item.id} value={candidate.item.id}>
              {candidate.item.stock_item_name}: {candidate.amount} {candidate.item.unit}{" "}
              {candidate.direction === "short" ? "short" : "over"}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      {line.direction === "short" ? (
        <FieldSet>
          <FieldLegend variant="label">What happened to the missing stock?</FieldLegend>
          <RadioGroup
            value={outcome}
            disabled={disabled}
            onValueChange={(value) => onOutcomeChange(value as DispatchResolutionOutcome)}
          >
            {shortageOutcomes.map((option) => (
              <Field key={option.value} orientation="horizontal">
                <RadioGroupItem value={option.value} id={`${lineId}-${option.value}`} />
                <FieldLabel htmlFor={`${lineId}-${option.value}`} className="flex-col items-start gap-1">
                  <span>{option.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {option.description}
                  </span>
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
        </FieldSet>
      ) : (
        <p className="rounded-md border bg-muted/30 p-3 text-sm">
          The branch counted more than was sent. Confirming the surplus deducts
          it from commissary stock, because it was packed by mistake.
        </p>
      )}
      <Field>
        <FieldLabel htmlFor={quantityId}>Quantity ({line.item.unit})</FieldLabel>
        <Input
          id={quantityId}
          inputMode="decimal"
          autoComplete="off"
          maxLength={80}
          disabled={disabled}
          value={quantity}
          onChange={(event) => onQuantityChange(event.target.value)}
        />
        <FieldDescription>
          {line.amount} {line.item.unit} unresolved.
        </FieldDescription>
      </Field>
      <DispatchShortageReasonField
        dispatchId={dispatchId}
        reason={reason}
        disabled={disabled}
        onReasonChange={onReasonChange}
      />
    </>
  );
}
