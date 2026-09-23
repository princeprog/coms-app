"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { suppliersEndpoint } from "@/features/suppliers/constants";
import {
  createSupplierSchema,
  supplierSchema,
  updateSupplierSchema,
} from "@/features/suppliers/schemas/supplier.schema";
import type { CatalogMutationResult } from "@/features/catalogs/types/catalog.types";

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to manage suppliers.";
    if (error.status === 404) return "This supplier is no longer available.";
    if (error.status === 400) return "Check the supplier details.";
    return error.message;
  }
  return "COMS could not complete this change. Try again.";
}

async function mutateSupplier(
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
    if (!supplierSchema.safeParse(payload).success) {
      throw new ApiRequestError("Invalid supplier response.", 502);
    }
    revalidatePath(suppliersEndpoint);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function createSupplierAction(
  input: unknown,
): Promise<CatalogMutationResult> {
  const parsed = createSupplierSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Check the supplier details." };
  return mutateSupplier("POST", suppliersEndpoint, parsed.data);
}

export async function updateSupplierAction(
  id: string,
  input: unknown,
): Promise<CatalogMutationResult> {
  const parsed = updateSupplierSchema.safeParse(input);
  if (!zUuid(id) || !parsed.success) {
    return { ok: false, error: "Check the supplier details." };
  }
  return mutateSupplier("PATCH", `${suppliersEndpoint}/${id}`, parsed.data);
}

export async function deactivateSupplierAction(
  id: string,
): Promise<CatalogMutationResult> {
  if (!zUuid(id)) return { ok: false, error: "Check the selected supplier." };
  return mutateSupplier("POST", `${suppliersEndpoint}/${id}/deactivate`);
}

function zUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
