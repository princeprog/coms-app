import "server-only";
import { isProtectedSuperAdmin } from "@/features/auth/permissions";
import { menuAccess, menuRequest } from "@/features/menus/services/menu-server";
import { ApiRequestError } from "@/services/api-services";
import {
  availableProductCategoriesEndpoint,
  productCategoriesEndpoint,
} from "../constants";
import {
  categoryQuerySchema,
  productCategoryPageSchema,
  type CategoryQuery,
} from "../schemas/product-category.schema";

export async function requireCategoryManager() {
  const user = await menuAccess("products.read");
  if (!isProtectedSuperAdmin(user))
    throw new ApiRequestError(
      "Only Super Admin can manage product categories.",
      403,
    );
}

export async function getProductCategories(
  input: CategoryQuery,
  available = false,
) {
  if (available) await menuAccess("products.read");
  else await requireCategoryManager();
  const query = categoryQuerySchema.parse(input);
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.page_size),
  });
  if (query.search) params.set("search", query.search);
  if (!available && query.is_active !== undefined)
    params.set("is_active", String(query.is_active));
  const endpoint = available
    ? availableProductCategoriesEndpoint
    : productCategoriesEndpoint;
  return menuRequest(`${endpoint}?${params}`, productCategoryPageSchema);
}
