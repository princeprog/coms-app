"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { inventoryEndpoints } from "@/features/inventory/constants";
import { setStockLevelsSchema } from "@/features/inventory/schemas/inventory.schema";
import type { InventoryMutationResult } from "@/features/inventory/types/inventory.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

function levelsError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to set levels for this location.";
    if (error.status === 404)
      return "This stock item or branch is no longer active.";
    if (error.status === 409)
      return "These levels were changed at the same time. Try again.";
    if (error.status === 400) return error.message;
  }
  return "COMS could not save these levels. Try again.";
}

export async function setStockLevelsAction(
  input: unknown,
): Promise<InventoryMutationResult> {
  const parsed = setStockLevelsSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the levels.",
    };
  try {
    await requestComsApi<unknown>(inventoryEndpoints.levels, {
      cookieHeader: (await cookies()).toString(),
      method: "PUT",
      body: parsed.data,
    });
    revalidatePath("/inventory");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: levelsError(error) };
  }
}

export type SetStockLevelsAction = typeof setStockLevelsAction;
