"use server";
import { ApiRequestError } from "@/services/api-services";
import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { hasPermission } from "@/features/auth/permissions";
import { requestComsApi } from "@/services/server-api-services";
import { stockItemPageSchema } from "@/features/stock-items/schemas/stock-item.schema";
import { stockItemsEndpoint } from "@/features/stock-items/constants";
import { purchasesEndpoint } from "../constants";
import {
  purchaseInputSchema,
  purchaseListSchema,
  purchaseDetailSchema,
  purchaseQuerySchema,
  type PurchaseQuery,
} from "../schemas/purchase.schema";
async function authorize(permission: string) {
  const session = await getCurrentUserFromServer();
  if (
    session.status !== "authenticated" ||
    !hasPermission(session.user, permission)
  )
    throw new Error("You do not have permission to access purchases.");
  return session.user;
}
export async function searchPurchaseStock(input: {
  search: string;
  page: number;
}) {
  await authorize("supplier_receipts.create");
  await authorize("stock_items.read");
  const parsed = z
    .object({ search: z.string().max(100), page: z.number().int().positive() })
    .parse(input);
  const query = new URLSearchParams({
    search: parsed.search,
    page: String(parsed.page),
    page_size: "25",
    is_active: "true",
  });
  const result = await requestComsApi<unknown>(
    `${stockItemsEndpoint}?${query}`,
    { cookieHeader: (await cookies()).toString() },
  );
  return stockItemPageSchema.parse(result);
}
export async function getPurchasePage(input: PurchaseQuery) {
  await authorize("supplier_receipts.read");
  const parsed = purchaseQuerySchema.parse(input);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== "") query.set(key, String(value));
  }
  return purchaseListSchema.parse(
    await requestComsApi<unknown>(`${purchasesEndpoint}?${query}`, {
      cookieHeader: (await cookies()).toString(),
    }),
  );
}
export async function getPurchaseDetail(id: string) {
  await authorize("supplier_receipts.read");
  z.uuid().parse(id);
  return purchaseDetailSchema.parse(
    await requestComsApi<unknown>(`${purchasesEndpoint}/${id}`, {
      cookieHeader: (await cookies()).toString(),
    }),
  );
}
export async function createPurchaseAction(
  input: unknown,
  key: string,
): Promise<{ ok: true; purchase_id: string } | { ok: false; error: string }> {
  try {
    await authorize("supplier_receipts.create");
    const parsed = purchaseInputSchema.parse(input);
    z.uuid().parse(key);
    const purchase = purchaseDetailSchema.parse(
      await requestComsApi<unknown>(purchasesEndpoint, {
        method: "POST",
        cookieHeader: (await cookies()).toString(),
        body: parsed,
        headers: { "Idempotency-Key": key },
      }),
    );
    return { ok: true, purchase_id: purchase.id };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof z.ZodError
          ? "Check the purchase details."
          : error instanceof ApiRequestError && error.status < 500
            ? error.message
            : "Purchase could not be recorded. Try again.",
    };
  }
}
