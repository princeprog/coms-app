import { CatalogCreateField } from "@/features/catalogs/components/catalog-create-field";
import type { CatalogFieldDefinition } from "@/features/catalogs/types/catalog.types";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  stockItemCategories,
  stockRecipeUseLabels,
} from "@/features/stock-items/constants";

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
    <FieldGroup>
      {renderField("stock_item_name", "e.g. All-purpose flour")}
      <FieldGroup className="grid gap-5 sm:grid-cols-2">
        <Field className="min-w-0 gap-2">
          <div className="flex items-center gap-1">
            <FieldLabel htmlFor="catalog-create-category">Category</FieldLabel>
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
              className="w-full data-[size=default]:h-11"
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent
              data-coms-ui="operational"
              alignItemWithTrigger={false}
            >
              <SelectGroup>
                {stockItemCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        {renderField("unit", "e.g. kg, pcs, L")}
      </FieldGroup>
      <Field className="min-w-0 gap-2">
        <FieldLabel htmlFor="catalog-create-recipe_use">Recipe use</FieldLabel>
        <Select
          name="recipe_use"
          value={values.recipe_use || "RECIPE"}
          disabled={pending}
          onValueChange={(value) => onChange("recipe_use", value ?? "RECIPE")}
        >
          <SelectTrigger
            id="catalog-create-recipe_use"
            aria-describedby="catalog-create-recipe_use-help"
            className="w-full data-[size=default]:h-11"
          >
            <SelectValue>
              {(value: keyof typeof stockRecipeUseLabels) =>
                stockRecipeUseLabels[value]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            data-coms-ui="operational"
            alignItemWithTrigger={false}
          >
            <SelectGroup>
              {Object.entries(stockRecipeUseLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldDescription id="catalog-create-recipe_use-help">
          Operating supplies, like cleaning items, are left out of product
          recipes.
        </FieldDescription>
      </Field>
    </FieldGroup>
  );
}
