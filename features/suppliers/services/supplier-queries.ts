import "server-only";

import { cookies } from "next/headers";
import { suppliersEndpoint } from "@/features/suppliers/constants";
import { supplierPageSchema } from "@/features/suppliers/schemas/supplier.schema";
import type { SupplierPage } from "@/features/suppliers/types/supplier.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

export async function getSupplierPageData({
  page,
  search,
  active,
}: {
  page: number;
  search: string;
  active?: boolean;
}): Promise<SupplierPage> {
  const params = new URLSearchParams({ page: String(page), page_size: "25" });
  if (search) params.set("search", search);
  if (active !== undefined) params.set("is_active", String(active));
  const payload = await requestComsApi<unknown>(
    `${suppliersEndpoint}?${params.toString()}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = supplierPageSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiRequestError("Invalid supplier catalog response.", 502);
  }
  return parsed.data;
}
