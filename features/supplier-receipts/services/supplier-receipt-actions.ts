"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  supplierReceiptsEndpoint,
  supplierReceiptsRoute,
} from "@/features/supplier-receipts/constants";
import {
  createSupplierReceiptSchema,
  supplierReceiptDetailSchema,
} from "@/features/supplier-receipts/schemas/supplier-receipt.schema";
import type {
  SupplierReceiptMutationResult,
  SupplierReceiptPostResult,
} from "@/features/supplier-receipts/types/supplier-receipt.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to manage supplier receipts.";
    if (error.status === 404)
      return "The supplier or stock item is no longer available.";
    if (error.status === 409)
      return "This idempotency key was already used with different receipt data. Change the receipt and submit again.";
    if (error.status === 400)
      return "Check the receipt date, quantities, and unit costs.";
    return error.message;
  }
  return "COMS could not complete this receipt. Try again.";
}

export async function createSupplierReceiptAction(
  input: unknown,
  idempotencyKey: string,
): Promise<SupplierReceiptMutationResult> {
  const parsedInput = createSupplierReceiptSchema.safeParse(input);
  const parsedKey = z.uuid().safeParse(idempotencyKey);
  if (!parsedInput.success || !parsedKey.success) {
    return { ok: false, error: "Check the receipt details." };
  }

  try {
    const payload = await requestComsApi<unknown>(supplierReceiptsEndpoint, {
      cookieHeader: (await cookies()).toString(),
      method: "POST",
      body: parsedInput.data,
      headers: { "Idempotency-Key": parsedKey.data },
    });
    const parsedReceipt = supplierReceiptDetailSchema.safeParse(payload);
    if (!parsedReceipt.success)
      throw new ApiRequestError("Invalid supplier receipt response.", 502);
    revalidatePath(supplierReceiptsRoute);
    revalidatePath(`${supplierReceiptsRoute}/${parsedReceipt.data.id}`);
    return { ok: true, receipt_id: parsedReceipt.data.id };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function postSupplierReceiptAction(
  id: string,
): Promise<SupplierReceiptPostResult> {
  if (!z.uuid().safeParse(id).success) {
    return { ok: false, error: "Check the selected supplier receipt." };
  }

  try {
    const payload = await requestComsApi<unknown>(
      `${supplierReceiptsEndpoint}/${id}/post`,
      {
        cookieHeader: (await cookies()).toString(),
        method: "POST",
      },
    );
    const parsedReceipt = supplierReceiptDetailSchema.safeParse(payload);
    if (!parsedReceipt.success || parsedReceipt.data.status !== "POSTED")
      throw new ApiRequestError(
        "Invalid posted supplier receipt response.",
        502,
      );
    revalidatePath(supplierReceiptsRoute);
    revalidatePath(`${supplierReceiptsRoute}/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}
