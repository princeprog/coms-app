"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { dashboardTodayEndpoint } from "../constants";
import {
  dashboardTodaySchema,
  type DashboardToday,
} from "../schemas/dashboard-today.schema";

export type DashboardTodayResult =
  { ok: true; data: DashboardToday } | { ok: false; error: string };

export async function getDashboardTodayAction(
  branchId?: string,
): Promise<DashboardTodayResult> {
  const branch = z.uuid().optional().safeParse(branchId);
  const query =
    branch.success && branch.data ? `?branch_id=${branch.data}` : "";
  try {
    const payload = await requestComsApi<unknown>(
      `${dashboardTodayEndpoint}${query}`,
      { cookieHeader: (await cookies()).toString() },
    );
    const parsed = dashboardTodaySchema.safeParse(payload);
    if (!parsed.success)
      return { ok: false, error: "COMS returned an unexpected dashboard." };
    return { ok: true, data: parsed.data };
  } catch (error) {
    if (error instanceof ApiRequestError)
      return {
        ok: false,
        error:
          error.status === 401
            ? "Your session expired. Sign in again."
            : error.status === 403
              ? "You don't have access to this dashboard."
              : error.message,
      };
    return {
      ok: false,
      error: "COMS could not load the dashboard. Try again.",
    };
  }
}
