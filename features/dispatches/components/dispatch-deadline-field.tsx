"use client";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function DispatchDeadlineField({
  value,
  error,
  disabled,
  onChange,
}: {
  value: string;
  error: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor="dispatch-receive-by">
        Receive by{" "}
        <span className="font-normal text-muted-foreground">(PHT)</span>
      </FieldLabel>
      <Input
        id="dispatch-receive-by"
        type="datetime-local"
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? "dispatch-deadline-error" : undefined}
        className="h-10"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <FieldError id="dispatch-deadline-error">{error}</FieldError>}
    </Field>
  );
}
