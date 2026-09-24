import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  RecipeIngredient,
  RecipeStockItem,
} from "@/features/recipes/types/recipe.types";

export type RecipeDraftIngredient = {
  draftId: string;
  stock_item_id: string;
  quantity_required: string;
};

type StockOption = Pick<RecipeStockItem, "id" | "stock_item_name" | "unit"> & {
  is_active: boolean;
};

export function RecipeIngredientFields({
  ingredients,
  stockItems,
  savedIngredients,
  disabled,
  onChange,
  onRemove,
}: {
  ingredients: RecipeDraftIngredient[];
  stockItems: RecipeStockItem[];
  savedIngredients: RecipeIngredient[];
  disabled: boolean;
  onChange: (index: number, patch: Partial<RecipeDraftIngredient>) => void;
  onRemove: (index: number) => void;
}) {
  const options: StockOption[] = [
    ...stockItems.map((item) => ({
      id: item.id,
      stock_item_name: item.stock_item_name,
      unit: item.unit,
      is_active: true,
    })),
    ...savedIngredients
      .filter(
        (ingredient) =>
          !ingredient.stock_item_is_active &&
          !stockItems.some((item) => item.id === ingredient.stock_item_id),
      )
      .map((ingredient) => ({
        id: ingredient.stock_item_id,
        stock_item_name: ingredient.stock_item_name,
        unit: ingredient.unit,
        is_active: false,
      })),
  ];

  return (
    <FieldGroup className="gap-3">
      {ingredients.map((ingredient, index) => {
        const selectedOption = options.find(
          (option) => option.id === ingredient.stock_item_id,
        );
        const stockItemId = `recipe-stock-item-${ingredient.draftId}`;
        const quantityId = `recipe-quantity-${ingredient.draftId}`;
        const inactiveNoteId = `${stockItemId}-note`;
        const quantityHelpId = `${quantityId}-unit`;

        return (
          <FieldSet
            key={ingredient.draftId}
            className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.65fr)_auto] sm:items-end"
          >
            <FieldLegend variant="label" className="px-1">
              Ingredient {index + 1}
            </FieldLegend>
            <Field>
              <FieldLabel htmlFor={stockItemId}>
                Ingredient {index + 1} stock item{" "}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                items={options.map((option) => ({
                  value: option.id,
                  label: `${option.stock_item_name} (${option.unit})${option.is_active ? "" : " — inactive"}`,
                }))}
                value={ingredient.stock_item_id}
                disabled={disabled}
                onValueChange={(value) =>
                  onChange(index, { stock_item_id: value ?? "" })
                }
              >
                <SelectTrigger
                  id={stockItemId}
                  className="w-full"
                  aria-describedby={
                    selectedOption && !selectedOption.is_active
                      ? inactiveNoteId
                      : undefined
                  }
                >
                  <SelectValue placeholder="Choose a stock item" />
                </SelectTrigger>
                <SelectContent data-coms-ui="operational">
                  {options.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.stock_item_name} ({option.unit})
                      {!option.is_active ? " — inactive" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOption && !selectedOption.is_active && (
                <FieldDescription
                  id={inactiveNoteId}
                  className="text-destructive"
                >
                  Replace or remove this inactive item before saving.
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor={quantityId}>
                Ingredient {index + 1} quantity required{" "}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id={quantityId}
                inputMode="decimal"
                autoComplete="off"
                maxLength={80}
                value={ingredient.quantity_required}
                disabled={disabled}
                onChange={(event) =>
                  onChange(index, { quantity_required: event.target.value })
                }
                placeholder="For example, 0.025"
                aria-describedby={quantityHelpId}
              />
              <FieldDescription id={quantityHelpId}>
                {selectedOption
                  ? `Quantity in ${selectedOption.unit}`
                  : "Choose a stock item to see the unit."}
              </FieldDescription>
            </Field>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              aria-label={`Remove ingredient ${index + 1}`}
              disabled={disabled || ingredients.length === 1}
              onClick={() => onRemove(index)}
            >
              Remove
            </Button>
          </FieldSet>
        );
      })}
    </FieldGroup>
  );
}
