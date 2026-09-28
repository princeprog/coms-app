"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import {
  dashboardQuerySchema,
  dashboardResponseSchema,
  type DashboardData,
} from "@/features/dashboard/schemas/dashboard.schema";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

export type DashboardActionResult =
  | { ok: true; data: DashboardData }
  | { ok: false; error: string; status: number };

export async function getGlobalDashboardAction(
  input: unknown,
): Promise<DashboardActionResult> {
  const parsed = dashboardQuerySchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Choose a valid dashboard period.",
      status: 400,
    };
  const params = new URLSearchParams({
    from: parsed.data.from,
    to: parsed.data.to,
  });
  if (parsed.data.branch_id) params.set("branch_id", parsed.data.branch_id);
  return loadDashboard(`/dashboard/overview?${params.toString()}`);
}

export async function getBranchDashboardAction(
  branchId: string,
  input: unknown,
): Promise<DashboardActionResult> {
  const id = z.uuid().safeParse(branchId);
  const parsed = dashboardQuerySchema
    .omit({ branch_id: true })
    .safeParse(input);
  if (!id.success || !parsed.success)
    return {
      ok: false,
      error: "Choose a valid branch and period.",
      status: 400,
    };
  const params = new URLSearchParams(parsed.data);
  return loadDashboard(`/branches/${id.data}/dashboard?${params.toString()}`);
}

async function loadDashboard(endpoint: string): Promise<DashboardActionResult> {
  try {
    const payload = await requestComsApi<unknown>(endpoint, {
      cookieHeader: (await cookies()).toString(),
    });
    const parsed = dashboardResponseSchema.safeParse(payload);
    if (!parsed.success)
      throw new ApiRequestError("Invalid dashboard response.", 502);
    return { ok: true, data: parsed.data };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const message =
        error.status === 401
          ? "Your session expired. Sign in again."
          : error.status === 403
            ? "You do not have dashboard access to this location."
            : error.status === 404
              ? "This branch is no longer available."
              : error.message;
      return { ok: false, error: message, status: error.status };
    }
    return {
      ok: false,
      error: "COMS could not load dashboard data. Refresh to try again.",
      status: 503,
    };
  }
}
