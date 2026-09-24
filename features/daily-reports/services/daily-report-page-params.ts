import { z } from "zod";
import {
  dailyReportRoute,
  dailyReportStatuses,
} from "@/features/daily-reports/constants";

export type DailyReportPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type DailyReportPageFilters = {
  branchId?: string;
  reportId?: string;
  status: "all" | (typeof dailyReportStatuses)[number];
  page: number;
};

export function parseDailyReportPageFilters(
  params: DailyReportPageSearchParams,
): DailyReportPageFilters {
  const branchId = z.uuid().safeParse(first(params.branch_id));
  const reportId = z.uuid().safeParse(first(params.report_id));
  const rawStatus = first(params.status);
  const pageValue = Number(first(params.page));
  return {
    status: dailyReportStatuses.find((status) => status === rawStatus) ?? "all",
    page:
      Number.isInteger(pageValue) && pageValue >= 1 && pageValue <= 1_000_000
        ? pageValue
        : 1,
    ...(branchId.success ? { branchId: branchId.data.toLowerCase() } : {}),
    ...(reportId.success ? { reportId: reportId.data.toLowerCase() } : {}),
  };
}

export function createDailyReportHref(filters: DailyReportPageFilters): string {
  const params = new URLSearchParams();
  if (filters.branchId) params.set("branch_id", filters.branchId);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.reportId) params.set("report_id", filters.reportId);
  const query = params.toString();
  return query ? `${dailyReportRoute}?${query}` : dailyReportRoute;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
