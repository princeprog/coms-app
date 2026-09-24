import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";
import { dailyReportEndpoint } from "@/features/daily-reports/constants";
import {
  dailyReportDetailSchema,
  dailyReportPageSchema,
} from "@/features/daily-reports/schemas/daily-report.schema";
import type {
  DailyReport,
  DailyReportPage,
} from "@/features/daily-reports/types/daily-report.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

export async function getDailyReportPageData({
  branchId,
  page,
  status,
}: {
  branchId: string;
  page: number;
  status?: string;
}): Promise<DailyReportPage> {
  if (!z.uuid().safeParse(branchId).success)
    throw new ApiRequestError("Daily reports not found.", 404);
  if (!Number.isInteger(page) || page < 1 || page > 1_000_000)
    throw new ApiRequestError("Invalid daily report page.", 400);

  const params = new URLSearchParams({ page: String(page), page_size: "25" });
  if (status) params.set("status", status);
  const payload = await requestComsApi<unknown>(
    `${dailyReportEndpoint(branchId)}?${params.toString()}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = dailyReportPageSchema.safeParse(payload);
  if (!parsed.success || parsed.data.page !== page)
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
