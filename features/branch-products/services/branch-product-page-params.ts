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
  search: string;
  isAvailable?: boolean;
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
  search,
  isAvailable,
}: {
  branchId?: string;
  page: number;
  search: string;
  isAvailable?: boolean;
}) {
  const params = new URLSearchParams();
  if (branchId) params.set("branch_id", branchId);
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
