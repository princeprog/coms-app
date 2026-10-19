import "server-only";

import { cookies } from "next/headers";
import { getBranchPageData } from "@/features/branches/services/branch-queries";
import { getProductPageData } from "@/features/products/services/product-queries";
import {
  branchProductsEndpoint,
  branchProductCategoriesEndpoint,
} from "@/features/branch-products/constants";
import {
  branchProductPageSchema,
  branchMenuCategoriesSchema,
} from "@/features/branch-products/schemas/branch-product.schema";
import type {
  BranchProductBranchOption,
  BranchProductPage,
  BranchProductProductOption,
} from "@/features/branch-products/types/branch-product.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

export async function getBranchProductPageData({
  branchId,
  page,
  pageSize = 10,
  search,
  isAvailable,
  serviceType,
  eligibleOnly,
  categoryId,
  sort,
}: {
  branchId: string;
  page: number;
  pageSize?: number;
  search: string;
  isAvailable?: boolean;
  serviceType?: "DINE_IN" | "TAKEAWAY";
  eligibleOnly?: boolean;
  categoryId?: string;
  sort?: string;
}): Promise<BranchProductPage> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (search) params.set("search", search);
  if (categoryId) params.set("category_id", categoryId);
  if (serviceType) params.set("service_type", serviceType);
  if (eligibleOnly) params.set("eligible_only", "true");
  if (sort) {
    const [by, order] = sort.split(":");
    params.set("sort_by", by);
    params.set("sort_order", order);
  }
  if (isAvailable !== undefined)
    params.set("is_available", String(isAvailable));
  const payload = await requestComsApi<unknown>(
    `${branchProductsEndpoint(branchId)}?${params.toString()}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = branchProductPageSchema.safeParse(payload);
  if (!parsed.success)
    throw new ApiRequestError("Invalid branch product response.", 502);
  return parsed.data;
}

export async function getBranchOptions(): Promise<BranchProductBranchOption[]> {
  const branches = await getAllPages(getBranchPageData);
  return branches.map((branch) => ({
    id: branch.id,
    name: branch.branch_name,
    status: branch.status,
    serviceTypes: [
      ...(branch.has_dine_in ? ["DINE_IN" as const] : []),
      ...(branch.has_takeaway !== false ? ["TAKEAWAY" as const] : []),
    ],
  }));
}

export async function getActiveProductOptions(): Promise<
  BranchProductProductOption[]
> {
  const products = await getAllPages((page) =>
    getProductPageData({ page, search: "", active: true }),
  );
  return products.map((product) => ({
    id: product.id,
    product_name: product.product_name,
  }));
}

async function getAllPages<T>(
  getPage: (page: number) => Promise<{
    items: T[];
    total: number;
    page_size: number;
  }>,
): Promise<T[]> {
  const firstPage = await getPage(1);
  const items = [...firstPage.items];
  const pageCount = Math.ceil(firstPage.total / firstPage.page_size);
  for (let page = 2; page <= pageCount; page += 1) {
    const nextPage = await getPage(page);
    items.push(...nextPage.items);
  }
  if (items.length !== firstPage.total)
    throw new ApiRequestError(
      "The branch or product options are incomplete.",
      502,
    );
  return items;
}

export async function getBranchMenuCategories(
  branchId: string,
  serviceType?: "DINE_IN" | "TAKEAWAY",
) {
  const params = new URLSearchParams();
  if (serviceType) params.set("service_type", serviceType);
  const payload = await requestComsApi<unknown>(
    `${branchProductCategoriesEndpoint(branchId)}${params.size ? `?${params}` : ""}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = branchMenuCategoriesSchema.safeParse(payload);
  if (!parsed.success)
    throw new ApiRequestError("Invalid menu category response.", 502);
  return parsed.data;
}
