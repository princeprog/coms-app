"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recipeInputSchema } from "@/features/recipes/schemas/recipe.schema";
import type {
  RecipeResponse,
  RecipeSaveAction,
  RecipeStockItem,
} from "@/features/recipes/types/recipe.types";
import {
  RecipeIngredientFields,
  type RecipeDraftIngredient,
} from "./recipe-ingredient-fields";
import { RecipeEditorActions } from "./recipe-editor-actions";
import { RecipeEditorNotices } from "./recipe-editor-notices";
import { RecipeReadOnlyTable } from "./recipe-read-only-table";

export function RecipeEditor({
  recipe,
  stockItems,
  canReadStockItems,
  stockItemsLoaded,
  canCreate,
  canUpdate,
  action,
}: {
  recipe: RecipeResponse;
  stockItems: RecipeStockItem[];
  canReadStockItems: boolean;
  stockItemsLoaded: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  action: RecipeSaveAction;
}) {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<RecipeDraftIngredient[]>(
    recipe.items.length
      ? recipe.items.map((item) => ({
          stock_item_id: item.stock_item_id,
          quantity_required: item.quantity_required,
        }))
      : [{ stock_item_id: "", quantity_required: "" }],
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const hasRecipe = recipe.items.length > 0;
  const mode = hasRecipe ? "update" : "create";
  const canEdit =
    recipe.product.is_active &&
    stockItemsLoaded &&
    stockItems.length > 0 &&
    (hasRecipe ? canUpdate : canCreate);

  function updateIngredient(
    index: number,
    patch: Partial<RecipeDraftIngredient>,
  ) {
    setIngredients((current) =>
      current.map((ingredient, rowIndex) =>
        rowIndex === index ? { ...ingredient, ...patch } : ingredient,
      ),
    );
  }

  function removeIngredient(index: number) {
    setIngredients((current) =>
      current.filter((_, rowIndex) => rowIndex !== index),
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !canEdit) return;

    if (
      ingredients.length === 0 ||
      ingredients.some(
        (item) => !item.stock_item_id || !item.quantity_required.trim(),
      )
    ) {
      setError("Add at least one ingredient with a positive quantity.");
      setStatus("");
      return;
    }

    const parsed = recipeInputSchema.safeParse({ items: ingredients });
    if (!parsed.success) {
      const duplicate =
        new Set(ingredients.map((item) => item.stock_item_id)).size !==
        ingredients.length;
      setError(
        duplicate
          ? "Choose each stock item only once."
          : "Enter a positive decimal quantity for every ingredient.",
      );
      setStatus("");
      return;
    }

    const activeIds = new Set(stockItems.map((item) => item.id));
    if (parsed.data.items.some((item) => !activeIds.has(item.stock_item_id))) {
      setError("Replace or remove inactive stock items before saving.");
      setStatus("");
      return;
    }

    setError("");
    setStatus("");
    startTransition(async () => {
      let result: Awaited<ReturnType<RecipeSaveAction>>;
      try {
        result = await action(recipe.product.id, mode, parsed.data);
      } catch {
        result = {
          ok: false,
          error: "COMS could not save this recipe. Try again.",
        };
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatus("Recipe saved.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recipe ingredients</CardTitle>
        <p className="text-sm text-muted-foreground">
          Quantities use the stock item&apos;s unit and keep their exact decimal
          precision.
        </p>
      </CardHeader>
      <CardContent>
        {canEdit && ingredients.length > 0 ? (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <RecipeIngredientFields
              ingredients={ingredients}
              stockItems={stockItems}
              savedIngredients={recipe.items}
              disabled={!canEdit || pending}
              onChange={updateIngredient}
              onRemove={removeIngredient}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {status && (
              <p role="status" aria-live="polite" className="text-sm">
                {status}
              </p>
            )}
            <RecipeEditorActions
              canEdit={canEdit}
              pending={pending}
              ingredientCount={ingredients.length}
              onAddIngredient={() =>
                setIngredients((current) => [
                  ...current,
                  { stock_item_id: "", quantity_required: "" },
                ])
              }
            />
          </form>
        ) : recipe.items.length > 0 ? (
          <RecipeReadOnlyTable items={recipe.items} />
        ) : (
          <p className="text-sm text-muted-foreground">
            This product has no recipe yet.
          </p>
        )}
        <div className="mt-4">
          <RecipeEditorNotices
            canReadStockItems={canReadStockItems}
            stockItemsLoaded={stockItemsLoaded}
            activeStockItemCount={stockItems.length}
            productIsActive={recipe.product.is_active}
            hasRecipe={hasRecipe}
            canCreate={canCreate}
            canUpdate={canUpdate}
          />
        </div>
      </CardContent>
    </Card>
  );
}
