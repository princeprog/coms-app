import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

export function DispatchShortageReasonField({
  dispatchId,
  reason,
  disabled,
  onReasonChange,
}: {
  dispatchId: string;
  reason: string;
  disabled: boolean;
  onReasonChange: (reason: string) => void;
}) {
  const inputId = `shortage-reason-${dispatchId}`;

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>Reason for shortage closure</FieldLabel>
      <Textarea
        id={inputId}
        maxLength={500}
        aria-describedby={`${inputId}-hint`}
        disabled={disabled}
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
      />
      <FieldDescription id={`${inputId}-hint`}>
        Maximum 500 characters.
      </FieldDescription>
    </Field>
  );
}
