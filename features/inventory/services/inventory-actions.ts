"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { inventoryEndpoints } from "@/features/inventory/constants";
import { createInventoryAdjustmentSchema } from "@/features/inventory/schemas/inventory.schema";
import type { InventoryMutationResult } from "@/features/inventory/types/inventory.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

const adjustmentTargetSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("COMMISSARY") }).strict(),
  z.object({ scope: z.literal("BRANCH"), branch_id: z.uuid() }).strict(),
]);

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to adjust this inventory.";
    if (error.status === 404)
      return "The selected stock item or branch is no longer available.";
    if (error.status === 409)
      return "This idempotency key was already used for a different adjustment.";
    if (error.status === 400)
      return "Check the quantity and reason for this adjustment.";
    return error.message;
  }
  return "COMS could not complete this adjustment. Try again.";
}

export async function adjustInventoryAction(
  input: unknown,
  target: unknown,
  idempotencyKey: string,
): Promise<InventoryMutationResult> {
  const parsedInput = createInventoryAdjustmentSchema.safeParse(input);
  const parsedTarget = adjustmentTargetSchema.safeParse(target);
  const parsedKey = z.uuid().safeParse(idempotencyKey);
  if (!parsedInput.success || !parsedTarget.success || !parsedKey.success) {
    return { ok: false, error: "Check the adjustment details." };
  }

  const targetValue = parsedTarget.data;
  const endpoint =
    targetValue.scope === "COMMISSARY"
      ? inventoryEndpoints.commissaryAdjustments
      : inventoryEndpoints.branchAdjustments(targetValue.branch_id);
  try {
    await requestComsApi<unknown>(endpoint, {
      cookieHeader: (await cookies()).toString(),
      method: "POST",
      body: parsedInput.data,
      headers: { "Idempotency-Key": parsedKey.data },
    });
    revalidatePath("/inventory");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}
