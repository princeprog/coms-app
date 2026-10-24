"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  closeDispatchShortageSchema,
  createDispatchSchema,
  dispatchDetailSchema,
  receiveDispatchSchema,
  sendDispatchDraftSchema,
  sendDispatchSchema,
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
import { countDifferences } from "./receiving-discrepancy";

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return error.message.startsWith("The person who")
        ? error.message
        : "You do not have permission to manage this dispatch or branch.";
    if (error.status === 404)
      return "This dispatch, branch, or stock item is no longer available.";
    if (error.status === 409)
      return error.message && !error.message.startsWith("Idempotency key")
        ? error.message
        : "The workflow changed or this retry key was already used. Refresh and try again.";
    if (error.status === 400)
      return "Check the quantities, delivery name, and reason, then try again.";
    return error.message;
  }
  return "COMS could not complete this dispatch action. Try again.";
}

function revalidateDispatchRoutes(id: string) {
  revalidatePath(dispatchesRoute);
  revalidatePath(`${dispatchesRoute}/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
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
    const outcome = parsedDispatch.data.receiving_outcome;
    return {
      ok: true,
      ...(outcome ? { receiving_outcome: outcome } : {}),
      // Sent quantities are visible once the final count is posted.
      ...(outcome === "POSTED"
        ? { differences: countDifferences(parsedDispatch.data.items) }
        : {}),
    };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function sendDispatchAction(
  input: unknown,
  idempotencyKey: string,
): Promise<DispatchMutationResult> {
  const parsedKey = z.uuid().safeParse(idempotencyKey);
  const parsedInput = sendDispatchSchema.safeParse(input);
  if (!parsedKey.success || !parsedInput.success)
    return {
      ok: false,
      error: "Check the branch, item lines, and who is delivering the stock.",
    };
  try {
    const payload = await requestComsApi<unknown>(
      `${dispatchesEndpoint}/send`,
      {
        cookieHeader: (await cookies()).toString(),
        method: "POST",
        body: parsedInput.data,
        headers: { "Idempotency-Key": parsedKey.data },
      },
    );
    const parsed = dispatchDetailSchema.safeParse(payload);
    if (!parsed.success || parsed.data.status === "DRAFT")
      throw new ApiRequestError(
        "The sending response could not be confirmed. Retry without editing to safely check the same dispatch.",
        502,
      );
    revalidateDispatchRoutes(parsed.data.id);
    return { ok: true, dispatch_id: parsed.data.id };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiRequestError && error.status === 400
          ? error.message
          : getActionError(error),
    };
  }
}

export async function createDispatchAction(
  input: unknown,
  idempotencyKey: string,
): Promise<DispatchMutationResult> {
  const parsedKey = z.uuid().safeParse(idempotencyKey);
  const parsedInput = createDispatchSchema.safeParse(input);
  if (!parsedKey.success || !parsedInput.success)
    return { ok: false, error: "Check the branch and dispatch item lines." };

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
    revalidateDispatchRoutes(parsedDispatch.data.id);
    return { ok: true, dispatch_id: parsedDispatch.data.id };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function postDispatchAction(
  id: string,
  input: unknown,
  idempotencyKey: string,
): Promise<DispatchActionResult> {
  const parsedId = z.uuid().safeParse(id);
  const parsedKey = z.uuid().safeParse(idempotencyKey);
  const parsedInput = sendDispatchDraftSchema.safeParse(input);
  if (!parsedId.success || !parsedKey.success)
    return { ok: false, error: "Check the selected dispatch." };
  if (!parsedInput.success)
    return { ok: false, error: "Enter who is delivering this dispatch." };
  return submitDispatchAction(
    `${dispatchesEndpoint}/${parsedId.data}/dispatch`,
    parsedId.data,
    parsedInput.data,
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
    return { ok: false, error: "Check the counted quantities." };
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
    return { ok: false, error: "Check the outcome, reason, and quantity." };
  return submitDispatchAction(
    `${dispatchesEndpoint}/${parsedId.data}/shortage-closures`,
    parsedId.data,
    parsedInput.data,
    parsedKey.data,
  );
}

export async function reviewLateCountAction(
  id: string,
  caseId: string,
  input: { action: "POST" | "RETURN"; reason?: string },
): Promise<DispatchActionResult> {
  const body = z
    .object({
      action: z.enum(["POST", "RETURN"]),
      reason: z.string().trim().max(500).optional(),
    })
    .safeParse(input);
  if (
    !z.uuid().safeParse(id).success ||
    !z.uuid().safeParse(caseId).success ||
    !body.success
  )
    return { ok: false, error: "Check the review action and reason." };
  return submitDispatchAction(
    `${dispatchesEndpoint}/${id}/late-counts/${caseId}/review`,
    id,
    body.data,
    globalThis.crypto.randomUUID(),
  );
}
