import type { ChangeEvent } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogFieldDefinition } from "@/features/catalogs/types/catalog.types";

export function CatalogCreateField({
  field,
  value,
  pending,
  placeholder,
  onChange,
}: {
  field: CatalogFieldDefinition;
  value: string;
  pending: boolean;
  placeholder: string;
  onChange: (key: string, value: string) => void;
}) {
  const id = `catalog-create-${field.key}`;
  const inputProps = {
    id,
    value,
    required: field.required,
    maxLength: field.maxLength,
    disabled: pending,
    placeholder,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(field.key, event.currentTarget.value),
  };

  return (
    <Field className="min-w-0 gap-2">
      <div className="flex items-center gap-1">
        <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
        {field.required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </div>
      {field.type === "textarea" ? (
        <Textarea {...inputProps} className="min-h-20 resize-y" />
      ) : (
        <Input
          {...inputProps}
          type={
            field.type === "email"
              ? "email"
              : field.key === "contact_number"
                ? "tel"
                : "text"
          }
          className="h-11"
        />
      )}
    </Field>
  );
}
