import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type {
  RecipeIngredient,
  RecipeStockItem,
} from "@/features/recipes/types/recipe.types";

export type RecipeDraftIngredient = {
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
    <div className="flex flex-col gap-4">
      {ingredients.map((ingredient, index) => {
        const selectedOption = options.find(
          (option) => option.id === ingredient.stock_item_id,
        );
        return (
          <fieldset
            key={index}
            className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.65fr)_auto] sm:items-end"
          >
            <legend className="px-1 text-sm font-medium">
              Ingredient {index + 1}
            </legend>
            <div className="grid gap-2">
              <Label htmlFor={`recipe-stock-item-${index}`}>
                Ingredient {index + 1} stock item
              </Label>
              <NativeSelect
                id={`recipe-stock-item-${index}`}
                value={ingredient.stock_item_id}
                disabled={disabled}
                onChange={(event) =>
                  onChange(index, { stock_item_id: event.target.value })
                }
                aria-describedby={
                  selectedOption && !selectedOption.is_active
                    ? `recipe-stock-item-${index}-note`
                    : undefined
                }
              >
                <NativeSelectOption value="">
                  Choose a stock item
                </NativeSelectOption>
                {options.map((option) => (
                  <NativeSelectOption key={option.id} value={option.id}>
                    {option.stock_item_name} ({option.unit})
                    {!option.is_active ? " — inactive" : ""}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {selectedOption && !selectedOption.is_active && (
                <span
                  id={`recipe-stock-item-${index}-note`}
                  className="text-xs text-destructive"
                >
                  Replace or remove this inactive item before saving.
                </span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`recipe-quantity-${index}`}>
                Ingredient {index + 1} quantity required
              </Label>
              <Input
                id={`recipe-quantity-${index}`}
                inputMode="decimal"
                autoComplete="off"
                maxLength={80}
                value={ingredient.quantity_required}
                disabled={disabled}
                onChange={(event) =>
                  onChange(index, { quantity_required: event.target.value })
                }
                placeholder="For example, 0.025"
              />
            </div>
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
          </fieldset>
        );
      })}
    </div>
  );
}
