import { parseTablePageSize } from "@/lib/table-pagination";
import { z } from "zod";
import { branchProductsRoute } from "@/features/branch-products/constants";

const uuidSchema = z.uuid();
const maxPage = 1_000_000;
const maxSearchLength = 100;

export type BranchProductsSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type BranchProductPageFilters = {
  page: number;
  pageSize?: number;
  search: string;
  isAvailable?: boolean;
  serviceType?: "DINE_IN" | "TAKEAWAY";
  sort?: string;
  requestedBranchId?: string;
};

export function parseBranchProductFilters(
  params: BranchProductsSearchParams,
): BranchProductPageFilters {
  const parsedPage = Number(first(params.page));
  const page =
    Number.isInteger(parsedPage) && parsedPage >= 1 && parsedPage <= maxPage
      ? parsedPage
      : 1;
  const rawAvailability = first(params.is_available);
  const branchId = uuidSchema.safeParse(first(params.branch_id));

  return {
    page,
    pageSize: parseTablePageSize(params.page_size),
    ...(["DINE_IN", "TAKEAWAY"].includes(first(params.service_type) ?? "")
      ? { serviceType: first(params.service_type) as "DINE_IN" | "TAKEAWAY" }
      : {}),
    ...([
      "product_name:asc",
      "product_name:desc",
      "price:asc",
      "price:desc",
      "created_at:asc",
      "created_at:desc",
    ].includes(first(params.sort) ?? "")
      ? { sort: first(params.sort) }
      : {}),
    search: (first(params.search) ?? "").trim().slice(0, maxSearchLength),
    ...(rawAvailability === "true"
      ? { isAvailable: true }
      : rawAvailability === "false"
        ? { isAvailable: false }
        : {}),
    ...(branchId.success
      ? { requestedBranchId: branchId.data.toLowerCase() }
      : {}),
  };
}

export function createBranchProductsHref({
  branchId,
  page,
  pageSize,
  search,
  isAvailable,
  serviceType,
  sort,
}: {
  branchId?: string;
  page: number;
  pageSize?: number;
  search: string;
  isAvailable?: boolean;
  serviceType?: "DINE_IN" | "TAKEAWAY";
  sort?: string;
}) {
  const params = new URLSearchParams();
  if (pageSize && pageSize !== 10) params.set("page_size", String(pageSize));
  if (branchId) params.set("branch_id", branchId);
  if (serviceType) params.set("service_type", serviceType);
  if (sort) params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  if (search.trim()) params.set("search", search.trim());
  if (isAvailable !== undefined)
    params.set("is_available", String(isAvailable));
  const query = params.toString();
  return query ? `${branchProductsRoute}?${query}` : branchProductsRoute;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
