"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import {
  branchProductsEndpoint,
  branchProductsRoute,
} from "@/features/branch-products/constants";
import {
  branchProductAvailabilitySchema,
  branchProductCreateSchema,
  branchProductPriceSchema,
  branchProductSchema,
} from "@/features/branch-products/schemas/branch-product.schema";
import type { BranchProductMutationResult } from "@/features/branch-products/types/branch-product.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

type BranchProductPermission =
  | "branch_products.create"
  | "branch_products.update"
  | "branch_products.availability_update";

const permissionMessages: Record<BranchProductPermission, string> = {
  "branch_products.create":
    "You do not have permission to create branch product offers.",
  "branch_products.update":
    "You do not have permission to update branch product prices.",
  "branch_products.availability_update":
    "You do not have permission to update product availability.",
};

function getActionError(error: unknown, operation: BranchProductPermission) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to manage this branch product.";
    if (error.status === 404)
      return "The branch, product, or offer is no longer available.";
    if (error.status === 409) {
      if (
        operation === "branch_products.create" &&
        error.message.toLowerCase().includes("already offered")
      )
        return "This product is already offered at the branch.";
      return "The product is inactive or this offer cannot be changed.";
    }
    if (error.status === 400)
      return "Check the product, price, and availability values.";
    return "COMS returned an invalid branch product response. Refresh and try again.";
  }
  return "COMS could not save this branch product. Try again.";
}

async function performBranchProductAction({
  branchId: branchIdValue,
  productId: productIdValue,
  permission,
  input,
  inputSchema,
  method,
  endpoint,
}: {
  branchId: unknown;
  productId?: unknown;
  permission: BranchProductPermission;
  input: unknown;
  inputSchema: z.ZodType;
  method: "POST" | "PATCH";
  endpoint: (branchId: string, productId?: string) => string;
}): Promise<BranchProductMutationResult> {
  const parsedBranchId = z.uuid().safeParse(branchIdValue);
  if (!parsedBranchId.success)
    return { ok: false, error: "Select a valid branch." };
  const parsedProductId =
    productIdValue === undefined
      ? undefined
      : z.uuid().safeParse(productIdValue);
  if (parsedProductId && !parsedProductId.success)
    return { ok: false, error: "Select a valid product." };
  const parsedInput = inputSchema.safeParse(input);
  if (!parsedInput.success)
    return {
      ok: false,
      error: "Check the product, price, and availability values.",
    };

  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated")
    return { ok: false, error: "Your session expired. Sign in again." };
  if (session.status === "recovering")
    return {
      ok: false,
      error: "Your session is being restored. Try again shortly.",
    };
  if (session.status === "unavailable")
    return {
      ok: false,
      error: "COMS authentication is unavailable. Try again shortly.",
    };
  if (!hasPermission(session.user, permission))
    return { ok: false, error: permissionMessages[permission] };
  if (!hasBranchScope(session.user, parsedBranchId.data))
    return { ok: false, error: "You do not have access to this branch." };

  try {
    const payload = await requestComsApi<unknown>(
      endpoint(parsedBranchId.data, parsedProductId?.data),
      {
        cookieHeader: (await cookies()).toString(),
        method,
        body: parsedInput.data,
      },
    );
    if (!branchProductSchema.safeParse(payload).success)
      throw new ApiRequestError("Invalid branch product response.", 502);
    revalidatePath(branchProductsRoute);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error, permission) };
  }
}

export async function createBranchProductAction(
  branchId: unknown,
  input: unknown,
): Promise<BranchProductMutationResult> {
  return performBranchProductAction({
    branchId,
    permission: "branch_products.create",
    input,
    inputSchema: branchProductCreateSchema,
    method: "POST",
    endpoint: (id) => branchProductsEndpoint(id),
  });
}

export async function updateBranchProductPriceAction(
  branchId: unknown,
  productId: unknown,
  input: unknown,
): Promise<BranchProductMutationResult> {
  return performBranchProductAction({
    branchId,
    productId,
    permission: "branch_products.update",
    input,
    inputSchema: branchProductPriceSchema,
    method: "PATCH",
    endpoint: (id, itemId) => `${branchProductsEndpoint(id)}/${itemId}`,
  });
}

export async function updateBranchProductAvailabilityAction(
  branchId: unknown,
  productId: unknown,
  input: unknown,
): Promise<BranchProductMutationResult> {
  return performBranchProductAction({
    branchId,
    productId,
    permission: "branch_products.availability_update",
    input,
    inputSchema: branchProductAvailabilitySchema,
    method: "POST",
    endpoint: (id, itemId) =>
      `${branchProductsEndpoint(id)}/${itemId}/availability`,
  });
}
