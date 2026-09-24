import "server-only";

import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import { getBranchOptions } from "@/features/branch-products/services/branch-product-queries";
import type { BranchProductBranchOption } from "@/features/branch-products/types/branch-product.types";
import type {
  DailyReport,
  DailyReportPage,
} from "@/features/daily-reports/types/daily-report.types";
import { ApiRequestError } from "@/services/api-services";
import { getTodayManilaDate } from "./manila-date";
import {
  createDailyReportHref,
  parseDailyReportPageFilters,
  type DailyReportPageSearchParams,
} from "./daily-report-page-params";
import {
  getDailyReportDetail,
  getDailyReportPageData,
} from "./daily-report-queries";

type Captured<T> = { data: T } | { error: unknown };

export type DailyReportsViewResult =
  | { status: "forbidden" }
  | { status: "session-expired" }
  | { status: "branch-options-error" }
  | { status: "branch-unavailable" }
  | { status: "list-error" }
  | { status: "redirect"; href: string }
  | {
      status: "ready";
      filters: ReturnType<typeof parseDailyReportPageFilters>;
      branchOptions: BranchProductBranchOption[];
      selectedBranch: BranchProductBranchOption;
      page: DailyReportPage;
      selectedReport: DailyReport | null;
      detailIssue: "not-found" | "unavailable" | null;
      todayManila: string;
      canCreate: boolean;
      canUpdate: boolean;
      canSubmit: boolean;
      canApprove: boolean;
      canReturn: boolean;
    };

function getAccessFailure(
  error: unknown,
): { status: "forbidden" } | { status: "session-expired" } | null {
  if (!(error instanceof ApiRequestError)) return null;
  if (error.status === 401) return { status: "session-expired" };
  if (error.status === 403) return { status: "forbidden" };
  return null;
}

function getAssignedBranchOptions(user: User): BranchProductBranchOption[] {
  const branchIds = user.branch_ids ?? [];
  return branchIds.map((id, index) => ({
    id: id.toLowerCase(),
    name:
      branchIds.length === 1
        ? "Assigned branch"
        : `Assigned branch ${index + 1}`,
    status: "unknown",
  }));
}

async function capture<T>(request: () => Promise<T>): Promise<Captured<T>> {
  try {
    return { data: await request() };
  } catch (error) {
    return { error };
  }
}

export async function loadDailyReportsView(
  user: User,
  searchParams: DailyReportPageSearchParams,
): Promise<DailyReportsViewResult> {
  if (!hasPermission(user, "daily_reports.read"))
    return { status: "forbidden" };

  const filters = parseDailyReportPageFilters(searchParams);
  let branchOptions: BranchProductBranchOption[];
  if (hasPermission(user, "branches.read")) {
    try {
      branchOptions = (await getBranchOptions()).filter((branch) =>
        hasBranchScope(user, branch.id),
      );
    } catch (error) {
      const accessFailure = getAccessFailure(error);
      return accessFailure ?? { status: "branch-options-error" };
    }
  } else {
    branchOptions = getAssignedBranchOptions(user);
  }
  if (branchOptions.length === 0) return { status: "branch-unavailable" };

  const selectedBranch = filters.branchId
    ? branchOptions.find(
        (branch) => branch.id.toLowerCase() === filters.branchId,
      )
    : branchOptions[0];
  if (!selectedBranch) return { status: "forbidden" };

  const [pageResult, detailResult] = await Promise.all([
    capture(() =>
      getDailyReportPageData({
        branchId: selectedBranch.id,
        page: filters.page,
        ...(filters.status !== "all" ? { status: filters.status } : {}),
      }),
    ),
    filters.reportId
      ? capture(() =>
          getDailyReportDetail(selectedBranch.id, filters.reportId!),
        )
      : Promise.resolve({ data: null } as Captured<DailyReport | null>),
  ]);

  for (const result of [pageResult, detailResult]) {
    if ("error" in result) {
      const accessFailure = getAccessFailure(result.error);
      if (accessFailure) return accessFailure;
    }
  }

  if ("error" in pageResult) return { status: "list-error" };
  if (pageResult.data.page !== filters.page) return { status: "list-error" };
  const pageCount = Math.max(
    1,
    Math.ceil(pageResult.data.total / pageResult.data.page_size),
  );
  if (filters.page > pageCount)
    return {
      status: "redirect",
      href: createDailyReportHref({ ...filters, page: pageCount }),
    };

  let selectedReport: DailyReport | null = null;
  let detailIssue: "not-found" | "unavailable" | null = null;
  if ("data" in detailResult) {
    selectedReport = detailResult.data;
    if (selectedReport && selectedReport.branch_id !== selectedBranch.id)
      return { status: "forbidden" };
  } else {
    detailIssue =
      detailResult.error instanceof ApiRequestError &&
      detailResult.error.status === 404
        ? "not-found"
        : "unavailable";
  }

  const canCreate =
    selectedBranch.status !== "inactive" &&
    hasPermission(user, "daily_reports.create");
  const canUpdate =
    selectedReport !== null &&
    (selectedReport.status === "DRAFT" ||
      selectedReport.status === "RETURNED") &&
    selectedBranch.status !== "inactive" &&
    hasPermission(user, "daily_reports.update");
  const canSubmit =
    selectedReport !== null &&
    (selectedReport.status === "DRAFT" ||
      selectedReport.status === "RETURNED") &&
    selectedReport.business_date < getTodayManilaDate() &&
    selectedBranch.status !== "inactive" &&
    hasPermission(user, "daily_reports.submit");
  const canReview =
    selectedReport?.status === "SUBMITTED" &&
    selectedBranch.status !== "inactive";

  return {
    status: "ready",
    filters: { ...filters, branchId: selectedBranch.id },
    branchOptions,
    selectedBranch,
    page: pageResult.data,
    selectedReport,
    detailIssue,
    todayManila: getTodayManilaDate(),
    canCreate,
    canUpdate,
    canSubmit: Boolean(canSubmit),
    canApprove: Boolean(
      canReview && hasPermission(user, "daily_reports.approve"),
    ),
    canReturn: Boolean(
      canReview && hasPermission(user, "daily_reports.return"),
    ),
  };
}
