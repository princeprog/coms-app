import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import type { CatalogFieldDefinition } from "../types/catalog.types";

export function CatalogCheckboxField({
  id,
  field,
  value,
  pending,
  onChange,
}: {
  id: string;
  field: CatalogFieldDefinition;
  value: string;
  pending: boolean;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <Field orientation="horizontal">
      <Checkbox
        id={id}
        checked={value === "true"}
        disabled={pending}
        aria-describedby={field.description ? `${id}-help` : undefined}
        onCheckedChange={(checked) =>
          onChange(field.key, String(checked === true))
        }
      />
      <FieldContent>
        <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
        {field.description && (
          <FieldDescription id={`${id}-help`}>
            {field.description}
          </FieldDescription>
        )}
      </FieldContent>
    </Field>
  );
}
