"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { salesEndpoint, salesRoute } from "@/features/sales/constants";
import {
  createSaleSchema,
  saleDetailSchema,
  voidSaleSchema,
} from "@/features/sales/schemas/sale.schema";
import type {
  SaleMutationResult,
  SaleVoidResult,
} from "@/features/sales/types/sale.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to complete this sale at the selected branch.";
    if (error.status === 404)
      return "The selected branch or sale is no longer available.";
    if (error.status === 409)
      return "Stock or product availability changed. Review the cart and try again.";
    if (error.status === 400)
      return "Check the tender method and sale quantities.";
  }
  return "COMS could not complete this sale. Your cart is still available to retry.";
}

async function getAuthorizedBranch(
  branchIdValue: unknown,
  permission: "sales.create" | "sales.void",
) {
  const parsedBranchId = z.uuid().safeParse(branchIdValue);
  if (!parsedBranchId.success)
    return { ok: false, error: "Select a valid branch." } as const;

  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated")
    return {
      ok: false,
      error: "Your session expired. Sign in again.",
    } as const;
  if (session.status === "recovering")
    return {
      ok: false,
      error: "Your session is being restored. Try again shortly.",
    } as const;
  if (session.status === "unavailable")
    return {
      ok: false,
      error: "COMS authentication is unavailable. Try again shortly.",
    } as const;
  if (!hasPermission(session.user, permission))
    return {
      ok: false,
      error:
        permission === "sales.create"
          ? "You do not have permission to create sales."
          : "You do not have permission to void sales.",
    } as const;
  if (!hasBranchScope(session.user, parsedBranchId.data))
    return {
      ok: false,
      error: "You do not have access to this branch.",
    } as const;

  return { ok: true, branchId: parsedBranchId.data } as const;
}

export async function createSaleAction(
  branchIdValue: unknown,
  input: unknown,
  idempotencyKeyValue: unknown,
): Promise<SaleMutationResult> {
  const parsedInput = createSaleSchema.safeParse(input);
  const parsedKey = z.uuid().safeParse(idempotencyKeyValue);
  if (!parsedInput.success || !parsedKey.success)
    return { ok: false, error: "Check the sale items and tender method." };

  const access = await getAuthorizedBranch(branchIdValue, "sales.create");
  if (access.ok === false) return { ok: false, error: access.error };

  try {
    const payload = await requestComsApi<unknown>(
      salesEndpoint(access.branchId),
      {
        cookieHeader: (await cookies()).toString(),
        method: "POST",
        body: parsedInput.data,
        headers: { "Idempotency-Key": parsedKey.data },
      },
    );
    const parsedSale = saleDetailSchema.safeParse(payload);
    if (!parsedSale.success)
      throw new ApiRequestError("Invalid sale response.", 502);
    if (parsedSale.data.branch_id !== access.branchId)
      throw new ApiRequestError("Invalid sale response.", 502);
    revalidatePath(salesRoute);
    return { ok: true, sale: parsedSale.data };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function voidSaleAction(
  branchIdValue: unknown,
  saleIdValue: unknown,
  input: unknown,
  idempotencyKeyValue: unknown,
): Promise<SaleVoidResult> {
  const saleId = z.uuid().safeParse(saleIdValue);
  const parsedInput = voidSaleSchema.safeParse(input);
  const parsedKey = z.uuid().safeParse(idempotencyKeyValue);
  if (!saleId.success || !parsedInput.success || !parsedKey.success)
    return { ok: false, error: "Check the sale and void reason." };

  const access = await getAuthorizedBranch(branchIdValue, "sales.void");
  if (access.ok === false) return { ok: false, error: access.error };

  try {
    const payload = await requestComsApi<unknown>(
      `${salesEndpoint(access.branchId)}/${saleId.data}/void`,
      {
        cookieHeader: (await cookies()).toString(),
        method: "POST",
        body: parsedInput.data,
        headers: { "Idempotency-Key": parsedKey.data },
      },
    );
    const parsedSale = saleDetailSchema.safeParse(payload);
    if (!parsedSale.success)
      throw new ApiRequestError("Invalid voided sale response.", 502);
    if (
      parsedSale.data.branch_id !== access.branchId ||
      parsedSale.data.id !== saleId.data ||
      parsedSale.data.status !== "VOIDED"
    )
      throw new ApiRequestError("Invalid voided sale response.", 502);
    revalidatePath(salesRoute);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}
