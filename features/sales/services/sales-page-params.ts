import { z } from "zod";
import { salesRoute } from "@/features/sales/constants";

export type SalesPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type SalesPageFilters = {
  branchId?: string;
  categoryId?: string;
  page: number;
  historyPage: number;
  historyPageSize?: number;
  historySearch?: string;
  historyStatus?: "COMPLETED" | "VOIDED";
  historyTender?: string;
  historyPeriod?: "today" | "all" | "custom";
  historyFrom?: string;
  historyTo?: string;
  search: string;
  saleId?: string;
  serviceType?: "DINE_IN" | "TAKEAWAY";
  view?: "checkout" | "history";
};

export function parseSalesPageFilters(
  params: SalesPageSearchParams,
): SalesPageFilters {
  const branchId = z.uuid().safeParse(first(params.branch_id));
  const categoryId = z.uuid().safeParse(first(params.category_id));
  const saleId = z.uuid().safeParse(first(params.sale_id));
  const period = first(params.history_period);
  const from = z.iso.date().safeParse(first(params.history_from));
  const to = z.iso.date().safeParse(first(params.history_to));
  const status = first(params.history_status);
  const size = Number(first(params.history_page_size));
  return {
    ...([10, 30, 50].includes(size) ? { historyPageSize: size } : {}),
    ...(first(params.history_search)?.trim()
      ? { historySearch: first(params.history_search)!.trim().slice(0, 100) }
      : {}),
    ...(status === "COMPLETED" || status === "VOIDED"
      ? { historyStatus: status }
      : {}),
    ...(first(params.history_tender)
      ? { historyTender: first(params.history_tender)!.slice(0, 40) }
      : {}),
    ...(period === "all" || period === "today"
      ? { historyPeriod: period }
      : {}),
    ...(period === "custom" &&
    from.success &&
    to.success &&
    from.data <= to.data
      ? {
          historyPeriod: "custom" as const,
          historyFrom: from.data,
          historyTo: to.data,
        }
      : {}),
    page: parsePage(first(params.page)),
    historyPage: parsePage(first(params.history_page)),
    search: (first(params.search) ?? "").trim().slice(0, 100),
    ...(["checkout", "history"].includes(first(params.view) ?? "")
      ? { view: first(params.view) as "checkout" | "history" }
      : {}),
    ...(branchId.success ? { branchId: branchId.data.toLowerCase() } : {}),
    ...(categoryId.success
      ? { categoryId: categoryId.data.toLowerCase() }
      : {}),
    ...(saleId.success ? { saleId: saleId.data.toLowerCase() } : {}),
    ...(["DINE_IN", "TAKEAWAY"].includes(first(params.service_type) ?? "")
      ? { serviceType: first(params.service_type) as "DINE_IN" | "TAKEAWAY" }
      : {}),
  };
}

export function createSalesHref(filters: SalesPageFilters): string {
  const params = new URLSearchParams();
  if (filters.branchId) params.set("branch_id", filters.branchId);
  if (filters.categoryId) params.set("category_id", filters.categoryId);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.historyPage > 1)
    params.set("history_page", String(filters.historyPage));
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.saleId) params.set("sale_id", filters.saleId);
  if (filters.serviceType) params.set("service_type", filters.serviceType);
  if (filters.view) params.set("view", filters.view);
  if (filters.historyPageSize && filters.historyPageSize !== 10)
    params.set("history_page_size", String(filters.historyPageSize));
  if (filters.historySearch)
    params.set("history_search", filters.historySearch);
  if (filters.historyStatus)
    params.set("history_status", filters.historyStatus);
  if (filters.historyTender)
    params.set("history_tender", filters.historyTender);
  if (filters.historyPeriod)
    params.set("history_period", filters.historyPeriod);
  if (filters.historyPeriod === "custom") {
    if (filters.historyFrom) params.set("history_from", filters.historyFrom);
    if (filters.historyTo) params.set("history_to", filters.historyTo);
  }
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
