import "server-only";

import { cookies } from "next/headers";
import { productRecipeEndpoint } from "@/features/recipes/constants";
import { recipeResponseSchema } from "@/features/recipes/schemas/recipe.schema";
import type {
  RecipeResponse,
  RecipeStockItem,
} from "@/features/recipes/types/recipe.types";
import { getStockItemPageData } from "@/features/stock-items/services/stock-item-queries";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

export async function getRecipe(productId: string): Promise<RecipeResponse> {
  const payload = await requestComsApi<unknown>(
    productRecipeEndpoint(productId),
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = recipeResponseSchema.safeParse(payload);
  if (!parsed.success)
    throw new ApiRequestError("Invalid product recipe response.", 502);
  return parsed.data;
}

export async function getActiveRecipeStockItems(): Promise<RecipeStockItem[]> {
  const firstPage = await getStockItemPageData({
    page: 1,
    search: "",
    active: true,
  });
  const items = [...firstPage.items];
  const pageCount = Math.ceil(firstPage.total / firstPage.page_size);
  for (let page = 2; page <= pageCount; page += 1) {
    const next = await getStockItemPageData({ page, search: "", active: true });
    items.push(...next.items);
  }
  if (items.length !== firstPage.total)
    throw new ApiRequestError("The stock-item options are incomplete.", 502);
  return items;
}
