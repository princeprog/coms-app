export type CatalogDirectoryFilters = {
  page: number;
  search: string;
  active: "all" | "true" | "false";
};

export function createCatalogHref(
  routePath: string,
  filters: CatalogDirectoryFilters,
) {
  const params = new URLSearchParams();
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.active !== "all") params.set("is_active", filters.active);
  return params.size ? `${routePath}?${params.toString()}` : routePath;
}
