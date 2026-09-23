"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { stockItemsEndpoint } from "@/features/stock-items/constants";
import {
  createStockItemSchema,
  stockItemSchema,
  updateStockItemSchema,
} from "@/features/stock-items/schemas/stock-item.schema";
import type { CatalogMutationResult } from "@/features/catalogs/types/catalog.types";

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to manage stock items.";
    if (error.status === 404) return "This stock item is no longer available.";
    if (error.status === 400) return "Check the stock item details.";
    return error.message;
  }
  return "COMS could not complete this change. Try again.";
}

async function mutateStockItem(
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
    if (!stockItemSchema.safeParse(payload).success) {
      throw new ApiRequestError("Invalid stock-item response.", 502);
    }
    revalidatePath(stockItemsEndpoint);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function createStockItemAction(
  input: unknown,
): Promise<CatalogMutationResult> {
  const parsed = createStockItemSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Check the stock item details." };
  return mutateStockItem("POST", stockItemsEndpoint, parsed.data);
}

export async function updateStockItemAction(
  id: string,
  input: unknown,
): Promise<CatalogMutationResult> {
  const parsed = updateStockItemSchema.safeParse(input);
  if (!isUuid(id) || !parsed.success) {
    return { ok: false, error: "Check the stock item details." };
  }
  return mutateStockItem("PATCH", `${stockItemsEndpoint}/${id}`, parsed.data);
}

export async function deactivateStockItemAction(
  id: string,
): Promise<CatalogMutationResult> {
  if (!isUuid(id))
    return { ok: false, error: "Check the selected stock item." };
  return mutateStockItem("POST", `${stockItemsEndpoint}/${id}/deactivate`);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
