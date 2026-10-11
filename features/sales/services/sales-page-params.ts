import { z } from "zod";
import { salesRoute } from "@/features/sales/constants";

export type SalesPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type SalesPageFilters = {
  branchId?: string;
  page: number;
  historyPage: number;
  search: string;
  saleId?: string;
  serviceType?: "DINE_IN" | "TAKEAWAY";
  view?: "checkout" | "history";
};

export function parseSalesPageFilters(
  params: SalesPageSearchParams,
): SalesPageFilters {
  const branchId = z.uuid().safeParse(first(params.branch_id));
  const saleId = z.uuid().safeParse(first(params.sale_id));
  return {
    page: parsePage(first(params.page)),
    historyPage: parsePage(first(params.history_page)),
    search: (first(params.search) ?? "").trim().slice(0, 100),
    ...(["checkout", "history"].includes(first(params.view) ?? "")
      ? { view: first(params.view) as "checkout" | "history" }
      : {}),
    ...(branchId.success ? { branchId: branchId.data.toLowerCase() } : {}),
    ...(saleId.success ? { saleId: saleId.data.toLowerCase() } : {}),
    ...(["DINE_IN", "TAKEAWAY"].includes(first(params.service_type) ?? "")
      ? { serviceType: first(params.service_type) as "DINE_IN" | "TAKEAWAY" }
      : {}),
  };
}

export function createSalesHref(filters: SalesPageFilters): string {
  const params = new URLSearchParams();
  if (filters.branchId) params.set("branch_id", filters.branchId);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.historyPage > 1)
    params.set("history_page", String(filters.historyPage));
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.saleId) params.set("sale_id", filters.saleId);
  if (filters.serviceType) params.set("service_type", filters.serviceType);
  if (filters.view) params.set("view", filters.view);
  const query = params.toString();
  return query ? `${salesRoute}?${query}` : salesRoute;
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 && page <= 1_000_000 ? page : 1;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
