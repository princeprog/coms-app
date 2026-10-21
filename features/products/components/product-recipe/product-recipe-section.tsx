"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";
import type { useProductRecipe } from "../../hooks/use-product-recipe";
import { ProductRecipeRow } from "./product-recipe-row";

export function ProductRecipeSection({
  recipe,
  services,
  disabled,
}: {
  recipe: ReturnType<typeof useProductRecipe>;
  services: ServiceType[];
  disabled: boolean;
}) {
  const showScope = services.length > 1;
  return (
    <FieldSet className="gap-3">
      <FieldLegend className="mb-2 font-semibold data-[variant=legend]:text-xl">
        Recipe
      </FieldLegend>
      <FieldDescription>
        {recipe.rows.length
          ? "Stock deducted from the selling branch for each one sold."
          : "No recipe. Sales of this product won't deduct stock."}
      </FieldDescription>
      {recipe.rows.length > 0 && (
        <>
          <div
            aria-hidden="true"
            className="hidden gap-3 text-sm font-medium text-muted-foreground sm:grid sm:grid-cols-12"
          >
            <span className={showScope ? "col-span-5" : "col-span-8"}>
              Stock item
            </span>
            <span className="col-span-3">Quantity per sale</span>
            {showScope && <span className="col-span-3">Applies to</span>}
          </div>
          <ul className="flex flex-col gap-3" aria-label="Recipe lines">
            {recipe.rows.map((row, index) => (
              <ProductRecipeRow
                key={row.key}
                row={row}
                index={index}
                showScope={showScope}
                disabled={disabled}
                error={recipe.errors[row.key]}
                onUpdate={(patch) => recipe.update(row.key, patch)}
                onRemove={() => recipe.remove(row.key)}
              />
            ))}
          </ul>
        </>
      )}
      <div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || recipe.rows.length >= 50}
          onClick={recipe.add}
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add stock item
        </Button>
      </div>
    </FieldSet>
  );
}
