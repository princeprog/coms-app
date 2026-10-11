import type { BranchDirectoryFilters } from "../types/branch.types";

export const branchDirectoryDefaults: BranchDirectoryFilters = {
  page: 1,
  search: "",
  status: "",
  service_type: "",
  sort: "name_asc",
};

export function readBranchDirectoryFilters(
  params: Record<string, string | string[] | undefined>,
): BranchDirectoryFilters {
  const first = (key: string) =>
    Array.isArray(params[key]) ? params[key][0] : params[key];
  const page = Number(first("page"));
  const status = first("status"),
    service = first("service_type"),
    sort = first("sort");
  return {
    page: Number.isInteger(page) && page > 0 && page <= 1_000_000 ? page : 1,
    search: (first("search") ?? "").trim().slice(0, 100),
    status: status === "active" || status === "inactive" ? status : "",
    service_type:
      service === "DINE_IN" || service === "TAKEAWAY" ? service : "",
    sort:
      sort === "name_desc" || sort === "opened_desc" || sort === "opened_asc"
        ? sort
        : "name_asc",
  };
}

export function branchDirectoryHref(filters: BranchDirectoryFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.service_type) params.set("service_type", filters.service_type);
  if (filters.sort !== "name_asc") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params.size ? `/branches?${params}` : "/branches";
}

export function branchDirectorySort(sort: BranchDirectoryFilters["sort"]) {
  return {
    sort_by: sort.startsWith("opened") ? "date_opened" : "branch_name",
    sort_order: sort.endsWith("desc") ? "desc" : "asc",
  };
}
