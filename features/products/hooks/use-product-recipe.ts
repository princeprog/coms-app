"use client";
import { useState } from "react";
import type { RecipeLine } from "../schemas/product-recipe.schema";
import type {
  RecipeRow,
  RecipeRowErrors,
} from "../services/product-recipe-rules";

const toRow = (line: RecipeLine): RecipeRow => ({
  key: crypto.randomUUID(),
  stock: {
    id: line.stock_item_id,
    stock_item_name: line.stock_item_name,
    unit: line.unit,
    is_active: line.is_active,
  },
  quantity: line.quantity,
  scope: line.usage_scope,
});

export function useProductRecipe(initial: RecipeLine[]) {
  const [rows, setRows] = useState<RecipeRow[]>(() => initial.map(toRow));
  const [errors, setErrors] = useState<RecipeRowErrors>({});
  function clearError(key: string) {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }
  return {
    rows,
    errors,
    setErrors,
    add: () =>
      setRows((current) => [
        ...current,
        { key: crypto.randomUUID(), stock: null, quantity: "", scope: "ALL" },
      ]),
    remove: (key: string) => {
      setRows((current) => current.filter((row) => row.key !== key));
      clearError(key);
    },
    update: (key: string, patch: Partial<Omit<RecipeRow, "key">>) => {
      setRows((current) =>
        current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
      );
      clearError(key);
    },
    // Stable, key-free form for dirty tracking.
    snapshot: rows.map((row) => [
      row.stock?.id ?? null,
      row.quantity,
      row.scope,
    ]),
  };
}
