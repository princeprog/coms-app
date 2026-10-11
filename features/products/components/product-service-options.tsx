"use client";
import { useId } from "react";
import { ShoppingBag, Utensils } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldSet,
  FieldLegend,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  FieldError,
} from "@/components/ui/field";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";

const options = [
  { value: "DINE_IN" as const, label: "Dine-in", icon: Utensils },
  { value: "TAKEAWAY" as const, label: "Takeout", icon: ShoppingBag },
];

export function ProductServiceOptions({
  value,
  onChange,
  disabled,
  error,
}: {
  value: ServiceType[];
  onChange: (value: ServiceType[]) => void;
  disabled: boolean;
  error?: string;
}) {
  const id = useId();
  return (
    <FieldSet className="gap-3">
      <FieldLegend className="mb-2 font-semibold data-[variant=legend]:text-xl">
        Service options
      </FieldLegend>
      <FieldDescription id={id + "-help"}>
        Choose how this product can be sold.
      </FieldDescription>
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        {options.map(({ value: type, label, icon: Icon }) => (
          <FieldLabel key={type} htmlFor={id + type}>
            <Field
              orientation="horizontal"
              className="min-h-14 gap-4"
              data-invalid={Boolean(error)}
              data-disabled={disabled}
            >
              <Checkbox
                id={id + type}
                checked={value.includes(type)}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? id + "-error" : id + "-help"}
                onCheckedChange={(checked) =>
                  onChange(
                    checked
                      ? [...new Set([...value, type])]
                      : value.filter((s) => s !== type),
                  )
                }
              />
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <FieldTitle>{label}</FieldTitle>
            </Field>
          </FieldLabel>
        ))}
      </FieldGroup>
      {error && <FieldError id={id + "-error"}>{error}</FieldError>}
    </FieldSet>
  );
}
