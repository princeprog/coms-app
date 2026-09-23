export type SupplierReceiptPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type SupplierReceiptStatusFilter = "all" | "DRAFT" | "POSTED";

export type SupplierReceiptPageFilters = {
  page: number;
  search: string;
  status: SupplierReceiptStatusFilter;
};

export function parseSupplierReceiptPageFilters(
  params: SupplierReceiptPageSearchParams,
): SupplierReceiptPageFilters {
  const parsedPage = Number(first(params.page));
  const page =
    Number.isInteger(parsedPage) && parsedPage >= 1 && parsedPage <= 1_000_000
      ? parsedPage
      : 1;
  const rawStatus = first(params.status);
  const status =
    rawStatus === "DRAFT" || rawStatus === "POSTED" ? rawStatus : "all";

  return {
    page,
    search: (first(params.search) ?? "").trim().slice(0, 100),
    status,
  };
}

export function createSupplierReceiptHref({
  page,
  search,
  status,
}: SupplierReceiptPageFilters) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (search.trim()) params.set("search", search.trim());
  if (status !== "all") params.set("status", status);
  const query = params.toString();
  return query ? `/receipts?${query}` : "/receipts";
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
