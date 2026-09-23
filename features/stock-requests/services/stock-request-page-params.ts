import { z } from "zod";
import { stockRequestStatuses } from "@/features/stock-requests/constants";

export type StockRequestPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type StockRequestStatusFilter =
  "all" | (typeof stockRequestStatuses)[number];

export type StockRequestPageFilters = {
  page: number;
  status: StockRequestStatusFilter;
  branch_id: "all" | string;
};

export function parseStockRequestPageFilters(
  params: StockRequestPageSearchParams,
): StockRequestPageFilters {
  const parsedPage = Number(first(params.page));
  const page =
    Number.isInteger(parsedPage) && parsedPage >= 1 && parsedPage <= 1_000_000
      ? parsedPage
      : 1;
  const rawStatus = first(params.status);
  const status =
    stockRequestStatuses.find((value) => value === rawStatus) ?? "all";
  const rawBranchId = first(params.branch_id);
  const branch_id = z.uuid().safeParse(rawBranchId).success
    ? rawBranchId!
    : "all";

  return { page, status, branch_id };
}

export function createStockRequestHref(filters: StockRequestPageFilters) {
  const params = new URLSearchParams();
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.branch_id !== "all") params.set("branch_id", filters.branch_id);
  const query = params.toString();
  return query ? `/replenishment?${query}` : "/replenishment";
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
