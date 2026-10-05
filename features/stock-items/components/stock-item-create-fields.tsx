import { CatalogCreateField } from "@/features/catalogs/components/catalog-create-field";
import type { CatalogFieldDefinition } from "@/features/catalogs/types/catalog.types";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stockItemCategories } from "@/features/stock-items/constants";

export function StockItemCreateFields({
  fields,
  values,
  pending,
  onChange,
}: {
  fields: CatalogFieldDefinition[];
  values: Record<string, string>;
  pending: boolean;
  onChange: (key: string, value: string) => void;
}) {
  const byKey = Object.fromEntries(fields.map((field) => [field.key, field]));
  const renderField = (key: string, placeholder: string) => {
    const field = byKey[key] as CatalogFieldDefinition | undefined;
    return field ? (
      <CatalogCreateField
        key={key}
        field={field}
        value={values[key] ?? ""}
        pending={pending}
        placeholder={placeholder}
        onChange={onChange}
      />
    ) : null;
  };

  return (
    <div className="space-y-7">
      <section
        aria-labelledby="stock-item-create-details"
        className="space-y-4"
      >
        <h3
          id="stock-item-create-details"
          className="border-b pb-2 text-sm font-semibold"
        >
          Stock item details
        </h3>
        {renderField("stock_item_name", "e.g. All-purpose flour")}
      </section>
      <section
        aria-labelledby="stock-item-create-tracking"
        className="space-y-4"
      >
        <h3
          id="stock-item-create-tracking"
          className="border-b pb-2 text-sm font-semibold"
        >
          Classification and unit
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="min-w-0 gap-2">
            <div className="flex items-center gap-1">
              <FieldLabel htmlFor="catalog-create-category">
                Category
              </FieldLabel>
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </div>
            <Select
              name="category"
              required
              value={values.category || null}
              disabled={pending}
              onValueChange={(value) => onChange("category", value ?? "")}
            >
              <SelectTrigger
                id="catalog-create-category"
                className="h-11 w-full"
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent data-coms-ui="operational">
                {stockItemCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {renderField("unit", "e.g. kg, pcs, L")}
        </div>
        <p className="text-sm text-muted-foreground">
          Use the same unit when receiving, counting, and dispatching this item.
        </p>
      </section>
    </div>
  );
}
