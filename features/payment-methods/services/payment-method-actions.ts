"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import {
  isProtectedSuperAdmin,
  hasPermission,
} from "@/features/auth/permissions";
import { requestComsApi } from "@/services/server-api-services";
import { ApiRequestError } from "@/services/api-services";
import type { CatalogMutationResult } from "@/features/catalogs/types/catalog.types";
import { paymentMethodsEndpoint } from "../constants";
import {
  paymentMethodChoiceSchema,
  paymentMethodSchema,
  savePaymentMethodSchema,
} from "../schemas/payment-method.schema";

export async function getAvailablePaymentMethodsAction() {
  const session = await getCurrentUserFromServer();
  if (
    session.status !== "authenticated" ||
    !hasPermission(session.user, "sales.create")
  )
    throw new Error(
      "Unable to load payment methods. Check your session and try again.",
    );
  const result = await requestComsApi<unknown>(
    `${paymentMethodsEndpoint}/available`,
    { cookieHeader: (await cookies()).toString() },
  );
  return z.array(paymentMethodChoiceSchema).parse(result);
}

async function mutate(
  method: "POST" | "PATCH",
  path: string,
  body?: unknown,
): Promise<CatalogMutationResult> {
  const session = await getCurrentUserFromServer();
  if (
    session.status !== "authenticated" ||
    !isProtectedSuperAdmin(session.user)
  )
    return { ok: false, error: "Only Super Admin can manage payment methods." };
  try {
    const result = await requestComsApi<unknown>(path, {
      method,
      body,
      cookieHeader: (await cookies()).toString(),
    });
    paymentMethodSchema.parse(result);
    revalidatePath(paymentMethodsEndpoint);
    revalidatePath("/pos");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiRequestError
          ? error.message
          : "Unable to save the payment method. Your changes are preserved; try again.",
    };
  }
}
export async function createPaymentMethodAction(
  input: unknown,
): Promise<CatalogMutationResult> {
  const parsed = savePaymentMethodSchema.safeParse(input);
  return parsed.success
    ? mutate("POST", paymentMethodsEndpoint, parsed.data)
    : { ok: false, error: "Enter a name, payment type and status." };
}
export async function updatePaymentMethodAction(
  id: string,
  input: unknown,
): Promise<CatalogMutationResult> {
  const parsed = savePaymentMethodSchema.safeParse(input);
  return z.uuid().safeParse(id).success && parsed.success
    ? mutate("PATCH", `${paymentMethodsEndpoint}/${id}`, parsed.data)
    : { ok: false, error: "Check the payment method details." };
}
export async function deactivatePaymentMethodAction(
  id: string,
): Promise<CatalogMutationResult> {
  return z.uuid().safeParse(id).success
    ? mutate("POST", `${paymentMethodsEndpoint}/${id}/deactivate`)
    : { ok: false, error: "Select a valid payment method." };
}
