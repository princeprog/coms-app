"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { productsEndpoint } from "@/features/products/constants";
import {
  createProductSchema,
  productSchema,
  updateProductSchema,
} from "@/features/products/schemas/product.schema";
import type { CatalogMutationResult } from "@/features/catalogs/types/catalog.types";

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to manage products.";
    if (error.status === 404) return "This product is no longer available.";
    if (error.status === 400) return "Check the product details.";
    return error.message;
  }
  return "COMS could not complete this change. Try again.";
}

async function mutateProduct(
  method: "POST" | "PATCH",
  endpoint: string,
  body?: unknown,
): Promise<CatalogMutationResult> {
  try {
    const payload = await requestComsApi<unknown>(endpoint, {
      cookieHeader: (await cookies()).toString(),
      method,
      body,
    });
    if (!productSchema.safeParse(payload).success) {
      throw new ApiRequestError("Invalid product response.", 502);
    }
    revalidatePath(productsEndpoint);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function createProductAction(
  input: unknown,
): Promise<CatalogMutationResult> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Check the product details." };
  return mutateProduct("POST", productsEndpoint, parsed.data);
}

export async function updateProductAction(
  id: string,
  input: unknown,
): Promise<CatalogMutationResult> {
  const parsed = updateProductSchema.safeParse(input);
  if (!isUuid(id) || !parsed.success) {
    return { ok: false, error: "Check the product details." };
  }
  return mutateProduct("PATCH", `${productsEndpoint}/${id}`, parsed.data);
}

export async function deactivateProductAction(
  id: string,
): Promise<CatalogMutationResult> {
  if (!isUuid(id)) return { ok: false, error: "Check the selected product." };
  return mutateProduct("POST", `${productsEndpoint}/${id}/deactivate`);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
