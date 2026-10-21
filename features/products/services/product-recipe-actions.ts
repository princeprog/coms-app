"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { isProtectedSuperAdmin } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { stockItemsEndpoint } from "@/features/stock-items/constants";
import { stockItemPageSchema } from "@/features/stock-items/schemas/stock-item.schema";
import { requestComsApi } from "@/services/server-api-services";
import type { RecipeStock } from "../schemas/product-recipe.schema";

export async function searchRecipeStock(input: {
  search: string;
  page: number;
}): Promise<{ items: RecipeStock[]; total: number; page: number }> {
  const session = await getCurrentUserFromServer();
  if (
    session.status !== "authenticated" ||
    !isProtectedSuperAdmin(session.user)
  )
    throw new Error("Only Super Admin can edit product recipes.");
  const parsed = z
    .object({ search: z.string().max(100), page: z.number().int().positive() })
    .parse(input);
  const query = new URLSearchParams({
    search: parsed.search,
    page: String(parsed.page),
    page_size: "25",
    is_active: "true",
    recipe_use: "RECIPE",
  });
  const page = stockItemPageSchema.parse(
    await requestComsApi<unknown>(`${stockItemsEndpoint}?${query}`, {
      cookieHeader: (await cookies()).toString(),
    }),
  );
  return {
    total: page.total,
    page: page.page,
    items: page.items.map((item) => ({
      id: item.id,
      stock_item_name: item.stock_item_name,
      unit: item.unit,
      is_active: item.is_active,
      category: item.category,
    })),
  };
}
