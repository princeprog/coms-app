"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { menuRequest } from "@/features/menus/services/menu-server";
import { ApiRequestError } from "@/services/api-services";
import { productCategoriesEndpoint } from "../constants";
import {
  categoryNameSchema,
  categoryQuerySchema,
  productCategorySchema,
} from "../schemas/product-category.schema";
import {
  getProductCategories,
  requireCategoryManager,
} from "./product-category-queries";

function categoryError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to manage categories.";
    return error.message;
  }
  return "Categories are unavailable. Try again.";
}

export async function searchAvailableCategoriesAction(input: unknown) {
  const parsed = categoryQuerySchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, error: "Check the category search." };
  try {
    return {
      ok: true as const,
      data: await getProductCategories(parsed.data, true),
    };
  } catch (error) {
    return { ok: false as const, error: categoryError(error) };
  }
}

async function mutateCategory(
  method: "POST" | "PATCH",
  suffix: string,
  body?: unknown,
) {
  try {
    await requireCategoryManager();
    const data = await menuRequest(
      `${productCategoriesEndpoint}${suffix}`,
      productCategorySchema,
      method,
      body,
    );
    revalidatePath("/products", "layout");
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: categoryError(error) };
  }
}

export async function saveProductCategoryAction(
  id: string | undefined,
  input: unknown,
) {
  const parsed = categoryNameSchema.safeParse(input);
  if (!parsed.success || (id !== undefined && !z.uuid().safeParse(id).success))
    return {
      ok: false as const,
      error: parsed.error?.issues[0]?.message ?? "Select a valid category.",
    };
  return mutateCategory(id ? "PATCH" : "POST", id ? `/${id}` : "", parsed.data);
}

export async function setProductCategoryActiveAction(
  id: string,
  active: boolean,
) {
  if (!z.uuid().safeParse(id).success || typeof active !== "boolean")
    return { ok: false as const, error: "Select a valid category." };
  return active
    ? mutateCategory("PATCH", `/${id}`, { is_active: true })
    : mutateCategory("POST", `/${id}/deactivate`);
}
