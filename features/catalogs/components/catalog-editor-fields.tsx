import type { ChangeEvent } from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogFieldDefinition } from "@/features/catalogs/types/catalog.types";

export function CatalogEditorFields({
  idPrefix,
  fields,
  values,
  pending,
  onChange,
}: {
  idPrefix: string;
  fields: CatalogFieldDefinition[];
  values: Record<string, string>;
  pending: boolean;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <FieldGroup className="gap-4">
      {fields.map((field) => {
        const id = `catalog-${idPrefix}-${field.key}`;
        const inputProps = {
          id,
          value: values[field.key] ?? "",
          required: field.required,
          maxLength: field.maxLength,
          disabled: pending,
          onChange: (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => onChange(field.key, event.currentTarget.value),
        };
        return (
          <Field key={field.key}>
            <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
            {field.type === "textarea" ? (
              <Textarea {...inputProps} />
            ) : (
              <Input {...inputProps} type={field.type ?? "text"} />
            )}
          </Field>
        );
      })}
    </FieldGroup>
  );
}
