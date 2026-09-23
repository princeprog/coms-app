import type { z } from "zod";
import type { stockItemSchema } from "@/features/stock-items/schemas/stock-item.schema";
import type { productPageSchema } from "@/features/products/schemas/product.schema";
import type {
  recipeIngredientSchema,
  recipeInputSchema,
  recipeProductSchema,
  recipeResponseSchema,
} from "@/features/recipes/schemas/recipe.schema";

export type RecipeProduct = z.infer<typeof recipeProductSchema>;
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;
export type RecipeResponse = z.infer<typeof recipeResponseSchema>;
export type RecipeInput = z.infer<typeof recipeInputSchema>;
export type RecipeStockItem = z.infer<typeof stockItemSchema>;
export type RecipeProductPage = z.infer<typeof productPageSchema>;

export type RecipeMutationResult = { ok: true } | { ok: false; error: string };
export type RecipeSaveAction = (
  productId: string,
  mode: "create" | "update",
  input: unknown,
) => Promise<RecipeMutationResult>;
