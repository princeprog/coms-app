"use client";
import { useId } from "react";
import {
  Field,
  FieldSet,
  FieldLegend,
  FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import type { ServiceType } from "../schemas/menu.schema";
export function ServiceTypeField({
  value,
  onChange,
  allowed = ["DINE_IN", "TAKEAWAY"],
  disabled = false,
  label = "Available for",
}: {
  value: ServiceType[];
  onChange: (value: ServiceType[]) => void;
  allowed?: ServiceType[];
  disabled?: boolean;
  label?: string;
}) {
  const fieldId = useId();
  return (
    <FieldSet>
      <FieldLegend variant="label">{label}</FieldLegend>
      <div className="flex flex-wrap gap-5">
        {(["DINE_IN", "TAKEAWAY"] as const).map((type) => (
          <Field key={type} orientation="horizontal">
            <Checkbox
              id={fieldId + type}
              checked={value.includes(type)}
              disabled={disabled || !allowed.includes(type)}
              onCheckedChange={(checked) =>
                onChange(
                  checked
                    ? [...new Set([...value, type])]
                    : value.filter((s) => s !== type),
                )
              }
            />
            <FieldLabel htmlFor={fieldId + type}>
              {type === "DINE_IN" ? "Dine-in" : "Takeout"}
            </FieldLabel>
          </Field>
        ))}
      </div>
    </FieldSet>
  );
}
