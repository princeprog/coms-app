"use client";

import type { ReactNode } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

export function PesoField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  disabled,
  autoFocus,
}: {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup className="h-11 bg-background">
        <InputGroupAddon align="inline-start" aria-hidden="true">
          <InputGroupText>₱</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          maxLength={18}
          className="h-full pr-3 text-base tabular-nums"
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
      </InputGroup>
      {error ? (
        <FieldError id={`${id}-error`}>{error}</FieldError>
      ) : (
        hint && <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>
      )}
    </Field>
  );
}
