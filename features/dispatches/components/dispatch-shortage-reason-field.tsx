import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

export function DispatchShortageReasonField({
  dispatchId,
  reason,
  disabled,
  error,
  onReasonChange,
}: {
  dispatchId: string;
  reason: string;
  disabled: boolean;
  error?: string;
  onReasonChange: (reason: string) => void;
}) {
  const inputId = `resolution-reason-${dispatchId}`;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={inputId}>Reason</FieldLabel>
      <Textarea
        id={inputId}
        maxLength={500}
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={`${inputId}-hint${error ? ` ${inputId}-error` : ""}`}
        disabled={disabled}
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
      />
      <FieldDescription id={`${inputId}-hint`}>
        Required. Explain what was checked. Maximum 500 characters.
      </FieldDescription>
      {error && <FieldError id={`${inputId}-error`}>{error}</FieldError>}
    </Field>
  );
}
