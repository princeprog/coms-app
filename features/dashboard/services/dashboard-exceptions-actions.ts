"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { dashboardExceptionsEndpoint } from "../constants";
import {
  dashboardExceptionsSchema,
  type DashboardExceptions,
} from "../schemas/dashboard-exceptions.schema";

export type DashboardExceptionsResult =
  { ok: true; data: DashboardExceptions } | { ok: false; error: string };

export async function getDashboardExceptionsAction(
  branchId?: string,
): Promise<DashboardExceptionsResult> {
  const branch = z.uuid().optional().safeParse(branchId);
  const query =
    branch.success && branch.data ? `?branch_id=${branch.data}` : "";
  try {
    const payload = await requestComsApi<unknown>(
      `${dashboardExceptionsEndpoint}${query}`,
      { cookieHeader: (await cookies()).toString() },
    );
    const parsed = dashboardExceptionsSchema.safeParse(payload);
    if (!parsed.success)
      return { ok: false, error: "COMS returned unexpected exception trends." };
    return { ok: true, data: parsed.data };
  } catch (error) {
    if (error instanceof ApiRequestError)
      return {
        ok: false,
        error:
          error.status === 401
            ? "Your session expired. Sign in again."
            : error.status === 403
              ? "You don't have access to these trends."
              : error.message,
      };
    return {
      ok: false,
      error: "COMS could not load exception trends. Try again.",
    };
  }
}
