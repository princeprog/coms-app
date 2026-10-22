import { z } from "zod";
import {
  dailyReportRoute,
  dailyReportStatuses,
} from "@/features/daily-reports/constants";

export type DailyReportPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

export const dailyReportPageSizes = [10, 30, 50] as const;

export type DailyReportPageFilters = {
  /** List filter; absent means every branch the user can read. */
  branchId?: string;
  reportId?: string;
  /** Branch of the opened report, kept apart so the list filters survive. */
  reportBranchId?: string;
  status: "all" | (typeof dailyReportStatuses)[number];
  dateFrom?: string;
  dateTo?: string;
  sort: "newest" | "oldest";
  page: number;
  pageSize: (typeof dailyReportPageSizes)[number];
};

export const defaultDailyReportFilters: DailyReportPageFilters = {
  status: "all",
  sort: "newest",
  page: 1,
  pageSize: 10,
};

const isoDate = z.iso.date();

export function parseDailyReportPageFilters(
  params: DailyReportPageSearchParams,
): DailyReportPageFilters {
  const branchId = z.uuid().safeParse(first(params.branch_id));
  const reportId = z.uuid().safeParse(first(params.report_id));
  const reportBranchId = z.uuid().safeParse(first(params.report_branch));
  const dateFrom = isoDate.safeParse(first(params.date_from));
  const dateTo = isoDate.safeParse(first(params.date_to));
  const rawStatus = first(params.status);
  const pageValue = Number(first(params.page));
  const sizeValue = Number(first(params.page_size));
  return {
    status: dailyReportStatuses.find((status) => status === rawStatus) ?? "all",
    sort: first(params.sort) === "oldest" ? "oldest" : "newest",
    page:
      Number.isInteger(pageValue) && pageValue >= 1 && pageValue <= 1_000_000
        ? pageValue
        : 1,
    pageSize: dailyReportPageSizes.find((size) => size === sizeValue) ?? 10,
    ...(branchId.success ? { branchId: branchId.data.toLowerCase() } : {}),
    ...(reportId.success ? { reportId: reportId.data.toLowerCase() } : {}),
    ...(reportBranchId.success
      ? { reportBranchId: reportBranchId.data.toLowerCase() }
      : {}),
    ...(dateFrom.success ? { dateFrom: dateFrom.data } : {}),
    ...(dateTo.success ? { dateTo: dateTo.data } : {}),
  };
}

export function createDailyReportHref(
  filters: Partial<DailyReportPageFilters>,
): string {
  const value = { ...defaultDailyReportFilters, ...filters };
  const params = new URLSearchParams();
  if (value.branchId) params.set("branch_id", value.branchId);
  if (value.status !== "all") params.set("status", value.status);
  if (value.dateFrom) params.set("date_from", value.dateFrom);
  if (value.dateTo) params.set("date_to", value.dateTo);
  if (value.sort !== "newest") params.set("sort", value.sort);
  if (value.page > 1) params.set("page", String(value.page));
  if (value.pageSize !== 10) params.set("page_size", String(value.pageSize));
  if (value.reportId) params.set("report_id", value.reportId);
  if (value.reportId && value.reportBranchId)
    params.set("report_branch", value.reportBranchId);
  const query = params.toString();
  return query ? `${dailyReportRoute}?${query}` : dailyReportRoute;
}

/** The list a report was opened from, without the report itself. */
export function listFilters(filters: DailyReportPageFilters) {
  const list = { ...filters };
  delete list.reportId;
  delete list.reportBranchId;
  return list;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
