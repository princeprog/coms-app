import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";
import { salesEndpoint } from "@/features/sales/constants";
import {
  saleDetailSchema,
  salePageSchema,
} from "@/features/sales/schemas/sale.schema";
import type { Sale, SalePage } from "@/features/sales/types/sale.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

export async function getSalePageData({
  branchId,
  page,
}: {
  branchId: string;
  page: number;
}): Promise<SalePage> {
  if (!z.uuid().safeParse(branchId).success)
    throw new ApiRequestError("Sale history not found.", 404);
  if (!Number.isInteger(page) || page < 1 || page > 1_000_000)
    throw new ApiRequestError("Invalid sale history page.", 400);

  const params = new URLSearchParams({ page: String(page), page_size: "25" });
  const payload = await requestComsApi<unknown>(
    `${salesEndpoint(branchId)}?${params}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = salePageSchema.safeParse(payload);
  if (!parsed.success || parsed.data.page !== page)
    throw new ApiRequestError("Invalid sale history response.", 502);
  return parsed.data;
}

export async function getSaleDetailData(
  branchId: string,
  saleId: string,
): Promise<Sale> {
  if (
    !z.uuid().safeParse(branchId).success ||
    !z.uuid().safeParse(saleId).success
  )
    throw new ApiRequestError("Sale not found.", 404);

  const payload = await requestComsApi<unknown>(
    `${salesEndpoint(branchId)}/${saleId}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = saleDetailSchema.safeParse(payload);
  if (!parsed.success)
    throw new ApiRequestError("Invalid sale detail response.", 502);
  return parsed.data;
}
