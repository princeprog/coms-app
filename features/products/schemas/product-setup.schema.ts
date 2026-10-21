import { z } from "zod";
import { productSchema, createProductSchema } from "./product.schema";
import {
  recipeLineInputSchema,
  recipeLineSchema,
} from "./product-recipe.schema";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";
export const productSetupSchema = z.object({
  product: productSchema,
  branch_ids: z.array(z.uuid()),
  recipe: z.array(recipeLineSchema).default([]),
});
export const productSetupInputSchema = z
  .object({
    expected_product_revision: z.number().int().nonnegative(),
    product: createProductSchema,
    recipe: z.array(recipeLineInputSchema).max(50).optional(),
  })
  .strict();
export type ProductSetup = z.infer<typeof productSetupSchema>;
export type ProductSetupInput = z.infer<typeof productSetupInputSchema>;
export type SetupBranch = {
  id: string;
  name: string;
  status: string;
  serviceTypes?: ServiceType[];
};
