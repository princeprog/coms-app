"use client";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ExpenseField({
  label,
  error,
  multiline,
  ...props
}: ComponentProps<typeof Input> & {
  label: string;
  error?: string;
  multiline?: boolean;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={props.id}>{label}</FieldLabel>
      {multiline ? (
        <Textarea
          {...(props as ComponentProps<typeof Textarea>)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${props.id}-error` : undefined}
        />
      ) : (
        <Input
          {...props}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${props.id}-error` : undefined}
        />
      )}
      {error && <FieldError id={`${props.id}-error`}>{error}</FieldError>}
    </Field>
  );
}
export function ExpenseSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
  error,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={value}
        onValueChange={(value) => value !== null && onChange(value)}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <SelectValue>
            {() =>
              options.find((option) => option.value === value)?.label ??
              "Choose an option"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent data-coms-ui="operational">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
