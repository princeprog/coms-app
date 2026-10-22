import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";
import {
  dailyReportDirectoryEndpoint,
  dailyReportEndpoint,
} from "@/features/daily-reports/constants";
import {
  dailyReportDetailSchema,
  dailyReportDirectorySchema,
} from "@/features/daily-reports/schemas/daily-report.schema";
import type {
  DailyReport,
  DailyReportDirectory,
} from "@/features/daily-reports/types/daily-report.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import type { DailyReportPageFilters } from "./daily-report-page-params";

/** Reports across every branch the user can read; the API applies branch scope. */
export async function getDailyReportDirectory(
  filters: DailyReportPageFilters,
): Promise<DailyReportDirectory> {
  const params = new URLSearchParams({
    page: String(filters.page),
    page_size: String(filters.pageSize),
    sort: filters.sort,
  });
  if (filters.branchId) params.set("branch_id", filters.branchId);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  const payload = await requestComsApi<unknown>(
    `${dailyReportDirectoryEndpoint}?${params.toString()}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = dailyReportDirectorySchema.safeParse(payload);
  if (!parsed.success || parsed.data.page !== filters.page)
    throw new ApiRequestError("Invalid daily report response.", 502);
  return parsed.data;
}

export async function getDailyReportDetail(
  branchId: string,
  reportId: string,
): Promise<DailyReport> {
  if (
    !z.uuid().safeParse(branchId).success ||
    !z.uuid().safeParse(reportId).success
  )
    throw new ApiRequestError("Daily report not found.", 404);

  const payload = await requestComsApi<unknown>(
    `${dailyReportEndpoint(branchId)}/${reportId}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = dailyReportDetailSchema.safeParse(payload);
  if (!parsed.success || parsed.data.branch_id !== branchId)
    throw new ApiRequestError("Invalid daily report detail response.", 502);
  return parsed.data;
}
