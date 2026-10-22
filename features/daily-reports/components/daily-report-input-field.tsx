import type { ReactNode } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function DailyReportDecimalField({
  id,
  label,
  unit,
  value,
  disabled,
  signed = false,
  error,
  labelClassName,
  className,
  onChange,
}: {
  id: string;
  label: ReactNode;
  unit?: string;
  value: string;
  disabled: boolean;
  signed?: boolean;
  error?: string | null;
  labelClassName?: string;
  className?: string;
  onChange: (value: string) => void;
}) {
  const describedBy =
    [signed && `${id}-hint`, error && `${id}-error`]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className={className ?? "flex flex-col gap-1.5"}>
      <label htmlFor={id} className={labelClassName ?? "text-sm font-medium"}>
        {label}
      </label>
      <InputGroup className="h-10 bg-background">
        <InputGroupInput
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          maxLength={80}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          placeholder={signed ? "±0" : undefined}
          className="text-right tabular-nums"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        {unit && (
          <InputGroupAddon align="inline-end">
            <InputGroupText>{unit}</InputGroupText>
          </InputGroupAddon>
        )}
      </InputGroup>
      {signed && (
        <p id={`${id}-hint`} className="sr-only">
          Use a minus sign for a decrease.
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function DailyReportReasonField({
  id,
  label,
  value,
  disabled,
  error,
  onChange,
}: {
  id: string;
  label: ReactNode;
  value: string;
  disabled: boolean;
  error?: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Textarea
        id={id}
        rows={2}
        maxLength={500}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn("min-h-16 bg-background")}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
