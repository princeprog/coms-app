"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import {
  dailyReportDetailSchema,
  createDailyReportSchema,
  returnDailyReportSchema,
  updateDailyReportSchema,
} from "@/features/daily-reports/schemas/daily-report.schema";
import {
  dailyReportEndpoint,
  dailyReportRoute,
} from "@/features/daily-reports/constants";
import type {
  DailyReportActionResult,
  DailyReportMutationResult,
} from "@/features/daily-reports/types/daily-report.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

type ReportPermission =
  | "daily_reports.create"
  | "daily_reports.update"
  | "daily_reports.submit"
  | "daily_reports.return"
  | "daily_reports.approve";

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to perform this report action at the selected branch.";
    if (error.status === 404)
      return "The selected branch or report is no longer available.";
    if (error.status === 409)
      return "The report changed or cannot transition from its current state. Refresh and review it.";
    if (error.status === 400)
      return "Check the business date, physical counts, and required reasons.";
  }
  return "COMS could not save this report action. Review the report and retry.";
}

async function getAuthorizedBranch(
  branchIdValue: unknown,
  permission: ReportPermission,
) {
  const parsedBranchId = z.uuid().safeParse(branchIdValue);
  if (!parsedBranchId.success)
    return { ok: false, error: "Select a valid branch." } as const;

  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated")
    return {
      ok: false,
      error: "Your session expired. Sign in again.",
    } as const;
  if (session.status === "recovering")
    return {
      ok: false,
      error: "Your session is being restored. Try again shortly.",
    } as const;
  if (session.status === "unavailable")
    return {
      ok: false,
      error: "COMS authentication is unavailable. Try again shortly.",
    } as const;
  if (!hasPermission(session.user, permission))
    return {
      ok: false,
      error: "You do not have permission to perform this report action.",
    } as const;
  const branchId = parsedBranchId.data.toLowerCase();
  if (!hasBranchScope(session.user, branchId))
    return {
      ok: false,
      error: "You do not have access to this branch.",
    } as const;

  return { ok: true, branchId } as const;
}

async function getAuthorizedReport(
  branchIdValue: unknown,
  reportIdValue: unknown,
  permission: ReportPermission,
) {
  const parsedReportId = z.uuid().safeParse(reportIdValue);
  if (!parsedReportId.success)
    return { ok: false, error: "Select a valid report." } as const;
  const branch = await getAuthorizedBranch(branchIdValue, permission);
  if (branch.ok === false) return branch;
  return {
    ok: true,
    branchId: branch.branchId,
    reportId: parsedReportId.data.toLowerCase(),
  } as const;
}

function parseReportResponse(payload: unknown, branchId: string) {
  const parsed = dailyReportDetailSchema.safeParse(payload);
  if (!parsed.success || parsed.data.branch_id !== branchId)
    throw new ApiRequestError("Invalid daily report response.", 502);
  return parsed.data;
}

export async function createDailyReportAction(
  branchIdValue: unknown,
  input: unknown,
  idempotencyKeyValue: unknown,
): Promise<DailyReportMutationResult> {
  const parsedInput = createDailyReportSchema.safeParse(input);
  const parsedKey = z.uuid().safeParse(idempotencyKeyValue);
  if (!parsedInput.success || !parsedKey.success)
    return { ok: false, error: "Choose a valid Manila business date." };

  const access = await getAuthorizedBranch(
    branchIdValue,
    "daily_reports.create",
  );
  if (access.ok === false) return { ok: false, error: access.error };

  try {
    const payload = await requestComsApi<unknown>(
      dailyReportEndpoint(access.branchId),
      {
        cookieHeader: (await cookies()).toString(),
        method: "POST",
        body: parsedInput.data,
        headers: { "Idempotency-Key": parsedKey.data },
      },
    );
    const report = parseReportResponse(payload, access.branchId);
    revalidatePath(dailyReportRoute);
    return { ok: true, report };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function updateDailyReportAction(
  branchIdValue: unknown,
  reportIdValue: unknown,
  input: unknown,
): Promise<DailyReportMutationResult> {
  const parsedInput = updateDailyReportSchema.safeParse(input);
  if (!parsedInput.success)
    return {
      ok: false,
      error:
        parsedInput.error.issues[0]?.message ??
        "Enter a count for each stock item and explain nonzero waste or adjustments.",
    };

  const access = await getAuthorizedReport(
    branchIdValue,
    reportIdValue,
    "daily_reports.update",
  );
  if (access.ok === false) return { ok: false, error: access.error };

  try {
    const payload = await requestComsApi<unknown>(
      `${dailyReportEndpoint(access.branchId)}/${access.reportId}`,
      {
        cookieHeader: (await cookies()).toString(),
        method: "PUT",
        body: parsedInput.data,
      },
    );
    const report = parseReportResponse(payload, access.branchId);
    if (report.id !== access.reportId)
      throw new ApiRequestError("Invalid daily report response.", 502);
    revalidatePath(dailyReportRoute);
    return { ok: true, report };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

async function postReportTransition(
  branchIdValue: unknown,
  reportIdValue: unknown,
  action: "submit" | "return" | "approve",
  permission: Extract<
    ReportPermission,
    "daily_reports.submit" | "daily_reports.return" | "daily_reports.approve"
  >,
  body?: unknown,
): Promise<DailyReportActionResult> {
  const access = await getAuthorizedReport(
    branchIdValue,
    reportIdValue,
    permission,
  );
  if (access.ok === false) return { ok: false, error: access.error };

  try {
    const payload = await requestComsApi<unknown>(
      `${dailyReportEndpoint(access.branchId)}/${access.reportId}/${action}`,
      {
        cookieHeader: (await cookies()).toString(),
        method: "POST",
        ...(body === undefined ? {} : { body }),
      },
    );
    const report = parseReportResponse(payload, access.branchId);
    const expectedStatuses = {
      submit: ["SUBMITTED", "APPROVED"],
      return: ["RETURNED"],
      approve: ["APPROVED"],
    }[action];
    if (
      report.id !== access.reportId ||
      !expectedStatuses.includes(report.status)
    )
      throw new ApiRequestError(
        "Invalid daily report transition response.",
        502,
      );
    revalidatePath(dailyReportRoute);
    if (action === "approve") revalidatePath("/inventory");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function submitDailyReportAction(
  branchId: unknown,
  reportId: unknown,
): Promise<DailyReportActionResult> {
  return postReportTransition(
    branchId,
    reportId,
    "submit",
    "daily_reports.submit",
  );
}

export async function returnDailyReportAction(
  branchId: unknown,
  reportId: unknown,
  input: unknown,
): Promise<DailyReportActionResult> {
  const parsedInput = returnDailyReportSchema.safeParse(input);
  if (!parsedInput.success)
    return { ok: false, error: "Enter a reason for returning the report." };
  return postReportTransition(
    branchId,
    reportId,
    "return",
    "daily_reports.return",
    parsedInput.data,
  );
}

export async function approveDailyReportAction(
  branchId: unknown,
  reportId: unknown,
): Promise<DailyReportActionResult> {
  return postReportTransition(
    branchId,
    reportId,
    "approve",
    "daily_reports.approve",
  );
}
