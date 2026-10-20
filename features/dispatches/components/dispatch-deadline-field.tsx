"use client";
import { DatePicker } from "@/components/shared/date-picker";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
  // Keep the two PHT wall-clock parts intact, including an incomplete time.
  const [date = "", time = ""] = value.split("T");
  const describedBy = error ? "dispatch-deadline-error" : undefined;
  return (
    <Field data-invalid={!!error} data-disabled={disabled}>
      <FieldLabel htmlFor="dispatch-receive-by">
        Estimated arrival{" "}
        <span className="font-normal text-muted-foreground">(PHT)</span>
      </FieldLabel>
      <FieldGroup className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <DatePicker
          id="dispatch-receive-by"
          label="Estimated arrival date (PHT)"
          className="h-11 px-3"
          value={date}
          disabled={disabled}
          invalid={!!error}
          describedBy={describedBy}
          captionLayout="label"
          onChange={(nextDate) => onChange(`${nextDate}T${time}`)}
        />
        <Input
          id="dispatch-arrival-time"
          type="time"
          aria-label="Estimated arrival time (PHT)"
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="h-11 min-w-0 w-full bg-background px-3"
          value={time}
          disabled={disabled}
          onChange={(event) => onChange(`${date}T${event.target.value}`)}
        />
      </FieldGroup>
      {error && <FieldError id="dispatch-deadline-error">{error}</FieldError>}
    </Field>
  );
}
