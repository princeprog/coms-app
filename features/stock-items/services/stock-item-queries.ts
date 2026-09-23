import "server-only";

import { cookies } from "next/headers";
import { stockItemsEndpoint } from "@/features/stock-items/constants";
import { stockItemPageSchema } from "@/features/stock-items/schemas/stock-item.schema";
import type { StockItemPage } from "@/features/stock-items/types/stock-item.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

export async function getStockItemPageData({
  page,
  search,
  active,
}: {
  page: number;
  search: string;
  active?: boolean;
}): Promise<StockItemPage> {
  const params = new URLSearchParams({ page: String(page), page_size: "25" });
  if (search) params.set("search", search);
  if (active !== undefined) params.set("is_active", String(active));
  const payload = await requestComsApi<unknown>(
    `${stockItemsEndpoint}?${params.toString()}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = stockItemPageSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiRequestError("Invalid stock-item catalog response.", 502);
  }
  return parsed.data;
}
