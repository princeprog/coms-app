"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  stockRequestsEndpoint,
  stockRequestsRoute,
} from "@/features/stock-requests/constants";
import {
  createStockRequestSchema,
  stockRequestDetailSchema,
} from "@/features/stock-requests/schemas/stock-request.schema";
import type {
  StockRequestMutationResult,
  StockRequestTransition,
  StockRequestTransitionResult,
} from "@/features/stock-requests/types/stock-request.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to manage this stock request or branch.";
    if (error.status === 404)
      return "The selected branch or stock item is no longer available.";
    if (error.status === 409)
      return "This request is no longer pending or the retry key has different request data.";
    if (error.status === 400)
      return "Check the requested stock items and quantities.";
    return error.message;
  }
  return "COMS could not complete this stock request. Try again.";
}

export async function createStockRequestAction(
  input: unknown,
  idempotencyKey: string,
): Promise<StockRequestMutationResult> {
  const parsedInput = createStockRequestSchema.safeParse(input);
  const parsedKey = z.uuid().safeParse(idempotencyKey);
  if (!parsedInput.success || !parsedKey.success)
    return { ok: false, error: "Check the stock request details." };

  try {
    const payload = await requestComsApi<unknown>(stockRequestsEndpoint, {
      cookieHeader: (await cookies()).toString(),
      method: "POST",
      body: parsedInput.data,
      headers: { "Idempotency-Key": parsedKey.data },
    });
    const parsedRequest = stockRequestDetailSchema.safeParse(payload);
    if (!parsedRequest.success)
      throw new ApiRequestError("Invalid stock request response.", 502);
    revalidateStockRequestRoutes(parsedRequest.data.id);
    return { ok: true, request_id: parsedRequest.data.id };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function transitionStockRequestAction(
  id: string,
  transition: StockRequestTransition,
): Promise<StockRequestTransitionResult> {
  if (!z.uuid().safeParse(id).success)
    return { ok: false, error: "Check the selected stock request." };
  const parsedTransition = z
    .enum(["approve", "reject", "cancel"])
    .safeParse(transition);
  if (!parsedTransition.success)
    return { ok: false, error: "Choose a valid stock request action." };

  const action = parsedTransition.data;
  const endpoint = `${stockRequestsEndpoint}/${id}/${action}`;
  const expectedStatus = {
    approve: "APPROVED",
    reject: "REJECTED",
    cancel: "CANCELLED",
  }[action];

  try {
    const payload = await requestComsApi<unknown>(endpoint, {
      cookieHeader: (await cookies()).toString(),
      method: "POST",
    });
    const parsedRequest = stockRequestDetailSchema.safeParse(payload);
    if (!parsedRequest.success || parsedRequest.data.status !== expectedStatus)
      throw new ApiRequestError(
        "Invalid transitioned stock request response.",
        502,
      );
    revalidateStockRequestRoutes(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

function revalidateStockRequestRoutes(id: string) {
  revalidatePath(stockRequestsRoute);
  revalidatePath(`${stockRequestsRoute}/${id}`);
}
