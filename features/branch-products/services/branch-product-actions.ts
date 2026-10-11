"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isProtectedSuperAdmin } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { branchProductsEndpoint, branchProductsRoute } from "../constants";
import {
  branchProductAvailabilitySchema,
  branchProductSchema,
} from "../schemas/branch-product.schema";
import type { BranchProductMutationResult } from "../types/branch-product.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
export async function updateBranchProductAvailabilityAction(
  branchId: unknown,
  productId: unknown,
  input: unknown,
): Promise<BranchProductMutationResult> {
  const branch = z.uuid().safeParse(branchId),
    product = z.uuid().safeParse(productId),
    parsed = branchProductAvailabilitySchema.safeParse(input);
  if (!branch.success || !product.success || !parsed.success)
    return { ok: false, error: "Check the selected product and availability." };
  const session = await getCurrentUserFromServer();
  if (session.status !== "authenticated")
    return { ok: false, error: "Your session is unavailable. Sign in again." };
  if (!isProtectedSuperAdmin(session.user))
    return { ok: false, error: "Only Super Admin can manage branch menus." };
  try {
    const payload = await requestComsApi<unknown>(
      `${branchProductsEndpoint(branch.data)}/${product.data}/availability`,
      {
        cookieHeader: (await cookies()).toString(),
        method: "POST",
        body: parsed.data,
      },
    );
    if (!branchProductSchema.safeParse(payload).success)
      throw new ApiRequestError("Invalid menu response.", 502);
    revalidatePath(branchProductsRoute);
    revalidatePath("/products");
    revalidatePath("/pos");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiRequestError && error.status < 500
          ? error.message
          : "The menu could not be updated. Your selection is preserved. Try again.",
    };
  }
}
