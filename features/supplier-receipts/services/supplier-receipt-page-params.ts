export type SupplierReceiptPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type SupplierReceiptPageFilters = {
  page: number;
  search: string;
  received_from?: string;
  received_to?: string;
  min_cost?: string;
  max_cost?: string;
  sort?: string;
};

export const receiptSortOptions = [
  { value: "newest", label: "Newest delivery" },
  { value: "oldest", label: "Oldest delivery" },
  { value: "cost_highest", label: "Highest total cost" },
  { value: "cost_lowest", label: "Lowest total cost" },
  { value: "supplier_asc", label: "Supplier A–Z" },
  { value: "supplier_desc", label: "Supplier Z–A" },
];

export function parseSupplierReceiptPageFilters(
  params: SupplierReceiptPageSearchParams,
): SupplierReceiptPageFilters {
  const parsedPage = Number(first(params.page));
  const page =
    Number.isInteger(parsedPage) && parsedPage >= 1 && parsedPage <= 1_000_000
      ? parsedPage
      : 1;
  const filters: SupplierReceiptPageFilters = {
    page,
    search: (first(params.search) ?? "").trim().slice(0, 100),
  };
  for (const key of ["received_from", "received_to"] as const) {
    const value = first(params[key]);
    if (
      value &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number(value.slice(0, 4)) > 0 &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value
    )
      filters[key] = value;
  }
  for (const key of ["min_cost", "max_cost"] as const) {
    const value = first(params[key]);
    if (value && value.length <= 80 && /^\d+(?:\.\d+)?$/.test(value))
      filters[key] = value;
  }
  const sort = first(params.sort);
  if (
    sort &&
    sort !== "newest" &&
    receiptSortOptions.some((option) => option.value === sort)
  )
    filters.sort = sort;
  return filters;
}

export function createSupplierReceiptHref(filters: SupplierReceiptPageFilters) {
  const { page, search } = filters;
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (search.trim()) params.set("search", search.trim());
  for (const key of [
    "received_from",
    "received_to",
    "min_cost",
    "max_cost",
    "sort",
  ] as const) {
    if (filters[key] && filters[key] !== "newest")
      params.set(key, filters[key]);
  }
  const query = params.toString();
  return query ? `/receipts?${query}` : "/receipts";
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
