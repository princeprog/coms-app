"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  closeDispatchShortageSchema,
  createDispatchSchema,
  dispatchDetailSchema,
  receiveDispatchSchema,
} from "@/features/dispatches/schemas/dispatch.schema";
import {
  dispatchesEndpoint,
  dispatchesRoute,
} from "@/features/dispatches/constants";
import type {
  DispatchActionResult,
  DispatchMutationResult,
} from "@/features/dispatches/types/dispatch.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to manage this dispatch or branch.";
    if (error.status === 404)
      return "This dispatch or stock request is no longer available.";
    if (error.status === 409)
      return "The workflow changed or this retry key was already used. Refresh and try again.";
    if (error.status === 400)
      return "Check the quantities, reason, and remaining in-transit amounts.";
    return error.message;
  }
  return "COMS could not complete this dispatch action. Try again.";
}

function revalidateDispatchRoutes(id: string, stockRequestId?: string) {
  revalidatePath(dispatchesRoute);
  revalidatePath(`${dispatchesRoute}/${id}`);
  if (stockRequestId) revalidatePath(`/replenishment/${stockRequestId}`);
}

async function submitDispatchAction(
  endpoint: string,
  id: string,
  body: unknown,
  idempotencyKey: string,
): Promise<DispatchActionResult> {
  try {
    const payload = await requestComsApi<unknown>(endpoint, {
      cookieHeader: (await cookies()).toString(),
      method: "POST",
      body,
      headers: { "Idempotency-Key": idempotencyKey },
    });
    const parsedDispatch = dispatchDetailSchema.safeParse(payload);
    if (!parsedDispatch.success)
      throw new ApiRequestError("Invalid dispatch action response.", 502);
    revalidateDispatchRoutes(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function createDispatchAction(
  stockRequestId: string,
  idempotencyKey: string,
): Promise<DispatchMutationResult> {
  const parsedRequestId = z.uuid().safeParse(stockRequestId);
  const parsedKey = z.uuid().safeParse(idempotencyKey);
  const parsedInput = createDispatchSchema.safeParse({
    stock_request_id: stockRequestId,
  });
  if (!parsedRequestId.success || !parsedKey.success || !parsedInput.success)
    return { ok: false, error: "Check the selected stock request." };

  try {
    const payload = await requestComsApi<unknown>(dispatchesEndpoint, {
      cookieHeader: (await cookies()).toString(),
      method: "POST",
      body: parsedInput.data,
      headers: { "Idempotency-Key": parsedKey.data },
    });
    const parsedDispatch = dispatchDetailSchema.safeParse(payload);
    if (!parsedDispatch.success || parsedDispatch.data.status !== "DRAFT")
      throw new ApiRequestError("Invalid created dispatch response.", 502);
    revalidateDispatchRoutes(parsedDispatch.data.id, stockRequestId);
    return { ok: true, dispatch_id: parsedDispatch.data.id };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function postDispatchAction(
  id: string,
  idempotencyKey: string,
): Promise<DispatchActionResult> {
  const parsedId = z.uuid().safeParse(id);
  const parsedKey = z.uuid().safeParse(idempotencyKey);
  if (!parsedId.success || !parsedKey.success)
    return { ok: false, error: "Check the selected dispatch." };
  return submitDispatchAction(
    `${dispatchesEndpoint}/${parsedId.data}/dispatch`,
    parsedId.data,
    undefined,
    parsedKey.data,
  );
}

export async function receiveDispatchAction(
  id: string,
  input: unknown,
  idempotencyKey: string,
): Promise<DispatchActionResult> {
  const parsedId = z.uuid().safeParse(id);
  const parsedKey = z.uuid().safeParse(idempotencyKey);
  const parsedInput = receiveDispatchSchema.safeParse(input);
  if (!parsedId.success || !parsedKey.success || !parsedInput.success)
    return { ok: false, error: "Check the received quantities." };
  return submitDispatchAction(
    `${dispatchesEndpoint}/${parsedId.data}/receive`,
    parsedId.data,
    parsedInput.data,
    parsedKey.data,
  );
}

export async function closeDispatchShortageAction(
  id: string,
  input: unknown,
  idempotencyKey: string,
): Promise<DispatchActionResult> {
  const parsedId = z.uuid().safeParse(id);
  const parsedKey = z.uuid().safeParse(idempotencyKey);
  const parsedInput = closeDispatchShortageSchema.safeParse(input);
  if (!parsedId.success || !parsedKey.success || !parsedInput.success)
    return { ok: false, error: "Check the shortage reason and quantities." };
  return submitDispatchAction(
    `${dispatchesEndpoint}/${parsedId.data}/shortage-closures`,
    parsedId.data,
    parsedInput.data,
    parsedKey.data,
  );
}
