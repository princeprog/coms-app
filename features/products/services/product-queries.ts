import "server-only";

import { cookies } from "next/headers";
import { productsEndpoint } from "@/features/products/constants";
import { productPageSchema } from "@/features/products/schemas/product.schema";
import type { ProductPage } from "@/features/products/types/product.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

export async function getProductPageData({
  page,
  search,
  active,
}: {
  page: number;
  search: string;
  active?: boolean;
}): Promise<ProductPage> {
  const params = new URLSearchParams({ page: String(page), page_size: "25" });
  if (search) params.set("search", search);
  if (active !== undefined) params.set("is_active", String(active));
  const payload = await requestComsApi<unknown>(
    `${productsEndpoint}?${params.toString()}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = productPageSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiRequestError("Invalid product catalog response.", 502);
  }
  return parsed.data;
}
