import {
  dispatchStatuses,
  dispatchesRoute,
} from "@/features/dispatches/constants";

export type DispatchPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type DispatchStatusFilter = "all" | (typeof dispatchStatuses)[number];
export type DispatchDiscrepancyFilter =
  | "all"
  | "NONE"
  | "OPEN"
  | "RECOUNT_REQUESTED"
  | "RESOLVED";

export type DispatchPageFilters = {
  page: number;
  status: DispatchStatusFilter;
  discrepancyStatus: DispatchDiscrepancyFilter;
};

export function parseDispatchPageFilters(
  params: DispatchPageSearchParams,
): DispatchPageFilters {
  const parsedPage = Number(first(params.page));
  const page =
    Number.isInteger(parsedPage) && parsedPage >= 1 && parsedPage <= 1_000_000
      ? parsedPage
      : 1;
  const rawStatus = first(params.status);
  const status = dispatchStatuses.find((value) => value === rawStatus) ?? "all";
  const rawDiscrepancyStatus = first(params.discrepancy_status);
  const discrepancyStatus: DispatchDiscrepancyFilter = [
    "NONE",
    "OPEN",
    "RECOUNT_REQUESTED",
    "RESOLVED",
  ].includes(rawDiscrepancyStatus ?? "")
    ? (rawDiscrepancyStatus as Exclude<DispatchDiscrepancyFilter, "all">)
    : "all";

  return { page, status, discrepancyStatus };
}

export function createDispatchHref(filters: DispatchPageFilters) {
  const params = new URLSearchParams();
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.discrepancyStatus !== "all")
    params.set("discrepancy_status", filters.discrepancyStatus);
  const query = params.toString();
  return query ? `${dispatchesRoute}?${query}` : dispatchesRoute;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
