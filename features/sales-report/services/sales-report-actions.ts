"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { salesReportEndpoint } from "../constants";
import {
  reportPeriods,
  salesReportSchema,
  type SalesReport,
} from "../schemas/sales-report.schema";

export type SalesReportResult =
  { ok: true; data: SalesReport } | { ok: false; error: string };

const input = z.object({
  period: z.enum(reportPeriods),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  branch_id: z.uuid().optional(),
});

export async function getSalesReportAction(
  value: unknown,
): Promise<SalesReportResult> {
  const query = input.parse(value);
  const params = new URLSearchParams({ period: query.period });
  if (query.date) params.set("date", query.date);
  if (query.branch_id) params.set("branch_id", query.branch_id);
  try {
    const payload = await requestComsApi<unknown>(
      `${salesReportEndpoint}?${params}`,
      { cookieHeader: (await cookies()).toString() },
    );
    const parsed = salesReportSchema.safeParse(payload);
    if (!parsed.success)
      return { ok: false, error: "COMS returned an unexpected sales report." };
    return { ok: true, data: parsed.data };
  } catch (error) {
    if (error instanceof ApiRequestError)
      return {
        ok: false,
        error:
          error.status === 401
            ? "Your session expired. Sign in again."
            : error.status === 403
              ? "You don't have access to this sales report."
              : error.message,
      };
    return {
      ok: false,
      error: "COMS could not load the sales report. Try again.",
    };
  }
}
