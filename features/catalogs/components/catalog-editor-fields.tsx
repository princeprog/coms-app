import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChangeEvent } from "react";
import { CatalogChoiceField } from "./catalog-choice-field";
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
        if (field.type === "select")
          return (
            <Field key={field.key}>
              <FieldLabel htmlFor={`catalog-${idPrefix}-${field.key}`}>
                {field.label}
              </FieldLabel>
              <Select
                value={values[field.key] ?? ""}
                onValueChange={(value) => onChange(field.key, value ?? "")}
                disabled={pending}
              >
                <SelectTrigger
                  id={`catalog-${idPrefix}-${field.key}`}
                  className="w-full"
                >
                  <SelectValue>
                    {() =>
                      field.options?.find(
                        (option) => option.value === values[field.key],
                      )?.label ?? "Select an option"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          );
        if (field.type === "choices")
          return (
            <CatalogChoiceField
              key={field.key}
              label={field.label}
              value={values[field.key] ?? ""}
              options={field.options ?? []}
              disabled={pending}
              onChange={(value) => onChange(field.key, value ?? "")}
            />
          );
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
