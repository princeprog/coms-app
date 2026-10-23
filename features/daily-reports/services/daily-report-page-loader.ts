import "server-only";

import {
  hasBranchScope,
  hasPermission,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import { getBranchOptions } from "@/features/branch-products/services/branch-product-queries";
import type { BranchProductBranchOption } from "@/features/branch-products/types/branch-product.types";
import { getBusinessToday } from "@/features/business-day/services/business-day-queries";
import type {
  DailyReport,
  DailyReportDirectory,
} from "@/features/daily-reports/types/daily-report.types";
import { ApiRequestError } from "@/services/api-services";
import { blockingReportShifts } from "./report-shift-blocks";
import {
  createDailyReportHref,
  parseDailyReportPageFilters,
  type DailyReportPageFilters,
  type DailyReportPageSearchParams,
} from "./daily-report-page-params";
import {
  getDailyReportDetail,
  getDailyReportDirectory,
} from "./daily-report-queries";

type AccessFailure = { status: "forbidden" } | { status: "session-expired" };

export type DailyReportsListView = {
  status: "list";
  filters: DailyReportPageFilters;
  branchOptions: BranchProductBranchOption[];
  directory: DailyReportDirectory;
  todayManila: string;
  /** Active branches where this user may create a draft. */
  createBranches: BranchProductBranchOption[];
};

export type DailyReportsDetailView = {
  status: "detail";
  filters: DailyReportPageFilters;
  selectedBranch: BranchProductBranchOption;
  selectedReport: DailyReport | null;
  detailIssue: "not-found" | "unavailable" | null;
  canUpdate: boolean;
  /** Allowed to submit once the report's blockers are cleared. */
  canPrepareSubmission: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReturn: boolean;
};

export type DailyReportsViewResult =
  | AccessFailure
  | { status: "branch-options-error" }
  | { status: "branch-unavailable" }
  | { status: "list-error" }
  | { status: "redirect"; href: string }
  | DailyReportsListView
  | DailyReportsDetailView;

function accessFailure(error: unknown): AccessFailure | null {
  if (!(error instanceof ApiRequestError)) return null;
  if (error.status === 401) return { status: "session-expired" };
  if (error.status === 403) return { status: "forbidden" };
  return null;
}

function assignedBranchOptions(user: User): BranchProductBranchOption[] {
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

async function loadBranchOptions(
  user: User,
): Promise<BranchProductBranchOption[] | AccessFailure | "error"> {
  if (!hasPermission(user, "branches.read")) return assignedBranchOptions(user);
  try {
    return (await getBranchOptions()).filter((branch) =>
      hasBranchScope(user, branch.id),
    );
  } catch (error) {
    return accessFailure(error) ?? "error";
  }
}

export async function loadDailyReportsView(
  user: User,
  searchParams: DailyReportPageSearchParams,
): Promise<DailyReportsViewResult> {
  if (!hasPermission(user, "daily_reports.read"))
    return { status: "forbidden" };

  const filters = parseDailyReportPageFilters(searchParams);
  const branchOptions = await loadBranchOptions(user);
  if (branchOptions === "error") return { status: "branch-options-error" };
  if (!Array.isArray(branchOptions)) return branchOptions;
  if (branchOptions.length === 0) return { status: "branch-unavailable" };
  const findBranch = (id: string | undefined) =>
    id
      ? branchOptions.find((branch) => branch.id.toLowerCase() === id)
      : undefined;
  if (filters.branchId && !findBranch(filters.branchId))
    return { status: "forbidden" };

  if (filters.reportId)
    return loadDetail(user, filters, branchOptions, findBranch);

  const [businessToday, directory] = await Promise.all([
    getBusinessToday(),
    getDailyReportDirectory(filters).then(
      (data) => ({ data }),
      (error: unknown) => ({ error }),
    ),
  ]);
  if ("error" in directory)
    return accessFailure(directory.error) ?? { status: "list-error" };
  const pageCount = Math.max(
    1,
    Math.ceil(directory.data.total / directory.data.page_size),
  );
  if (filters.page > pageCount)
    return {
      status: "redirect",
      href: createDailyReportHref({ ...filters, page: pageCount }),
    };
  const canCreate =
    !isProtectedSuperAdmin(user) && hasPermission(user, "daily_reports.create");
  return {
    status: "list",
    filters,
    branchOptions,
    directory: directory.data,
    todayManila: businessToday,
    createBranches: canCreate
      ? branchOptions.filter((branch) => branch.status !== "inactive")
      : [],
  };
}

async function loadDetail(
  user: User,
  filters: DailyReportPageFilters,
  branchOptions: BranchProductBranchOption[],
  findBranch: (id: string | undefined) => BranchProductBranchOption | undefined,
): Promise<DailyReportsViewResult> {
  const branchId = filters.reportBranchId ?? filters.branchId;
  const selectedBranch = branchId ? findBranch(branchId) : branchOptions[0];
  if (!selectedBranch) return { status: "forbidden" };

  const [businessToday, detail] = await Promise.all([
    getBusinessToday(),
    getDailyReportDetail(selectedBranch.id, filters.reportId!).then(
      (data) => ({ data }),
      (error: unknown) => ({ error }),
    ),
  ]);
  let selectedReport: DailyReport | null = null;
  let detailIssue: DailyReportsDetailView["detailIssue"] = null;
  if ("error" in detail) {
    const failure = accessFailure(detail.error);
    if (failure) return failure;
    detailIssue =
      detail.error instanceof ApiRequestError && detail.error.status === 404
        ? "not-found"
        : "unavailable";
  } else {
    selectedReport = detail.data;
    if (selectedReport.branch_id !== selectedBranch.id)
      return { status: "forbidden" };
  }

  const isBranchOperator = !isProtectedSuperAdmin(user);
  const editable =
    selectedReport !== null &&
    (selectedReport.status === "DRAFT" ||
      selectedReport.status === "RETURNED") &&
    selectedBranch.status !== "inactive";
  const canUpdate =
    isBranchOperator && editable && hasPermission(user, "daily_reports.update");
  const canPrepareSubmission =
    isBranchOperator && editable && hasPermission(user, "daily_reports.submit");
  const canSubmit =
    canPrepareSubmission &&
    selectedReport !== null &&
    (selectedReport.submission_checklist_bypassed === true ||
      (selectedReport.items.every(
        (item) => item.physical_closing_quantity !== null,
      ) &&
        selectedReport.business_date < businessToday &&
        (() => {
          const blocked = blockingReportShifts(selectedReport);
          return !blocked.open.length && !blocked.unreviewed.length;
        })()));
  const canReview =
    selectedReport?.status === "SUBMITTED" &&
    (selectedBranch.status !== "inactive" || isProtectedSuperAdmin(user));

  return {
    status: "detail",
    filters,
    selectedBranch,
    selectedReport,
    detailIssue,
    canUpdate,
    canPrepareSubmission,
    canSubmit: Boolean(canSubmit),
    canApprove: Boolean(
      canReview && hasPermission(user, "daily_reports.approve"),
    ),
    canReturn: Boolean(
      canReview && hasPermission(user, "daily_reports.return"),
    ),
  };
}
