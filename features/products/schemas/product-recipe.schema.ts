import { z } from "zod";

export const recipeUsageScopeSchema = z.enum(["ALL", "DINE_IN", "TAKEAWAY"]);
export type RecipeUsageScope = z.infer<typeof recipeUsageScopeSchema>;

export const RECIPE_QUANTITY_PATTERN = /^\d+(?:\.\d{1,4})?$/;
const ZERO_PATTERN = /^0(?:\.0+)?$/;

export const recipeLineSchema = z.object({
  stock_item_id: z.uuid(),
  stock_item_name: z.string(),
  unit: z.string(),
  is_active: z.boolean(),
  usage_scope: recipeUsageScopeSchema,
  quantity: z.string(),
});
export type RecipeLine = z.infer<typeof recipeLineSchema>;

export const recipeLineInputSchema = z
  .object({
    stock_item_id: z.uuid(),
    quantity: z
      .string()
      .trim()
      .regex(
        RECIPE_QUANTITY_PATTERN,
        "Enter a quantity with up to 4 decimal places.",
      )
      .refine(
        (value) => !ZERO_PATTERN.test(value),
        "Enter a quantity greater than zero.",
      ),
    usage_scope: recipeUsageScopeSchema,
  })
  .strict();
export type RecipeLineInput = z.infer<typeof recipeLineInputSchema>;

export type RecipeStock = {
  id: string;
  stock_item_name: string;
  unit: string;
  is_active: boolean;
  category?: string;
};
