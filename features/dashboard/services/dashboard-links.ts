import { createDailyReportHref } from "@/features/daily-reports/services/daily-report-page-params";
import { shiftHref } from "@/features/shifts/constants";
import type {
  DashboardAttention,
  ReportProgress,
} from "../schemas/dashboard-today.schema";
import { attentionHref } from "./attention";

export function salesReportHref(branchId?: string) {
  const query = new URLSearchParams({ period: "day" });
  if (branchId) query.set("branch_id", branchId);
  return `/sales-report?${query}`;
}

export function reportProgressHref(report: ReportProgress) {
  return createDailyReportHref({
    branchId: report.branch_id,
    dateFrom: report.business_date,
    dateTo: report.business_date,
    ...(report.report_id
      ? { reportId: report.report_id, reportBranchId: report.branch_id }
      : {}),
  });
}

export function attentionExampleHref(item: DashboardAttention) {
  const sample = item.example;
  if (!sample) return attentionHref(item.key);
  const branch = sample.branch_id ?? undefined;
  if (
    [
      "deliveries_overdue",
      "open_discrepancies",
      "late_counts_to_review",
      "dispatches_draft",
      "deliveries_in_transit",
    ].includes(item.key)
  )
    return `/dispatches/${sample.record_id}`;
  if (
    ["shifts_open_past_day", "cash_shortages", "shifts_to_review"].includes(
      item.key,
    ) &&
    branch
  )
    return shiftHref(branch, sample.record_id);
  if (item.key.startsWith("reports_") && branch)
    return createDailyReportHref({
      branchId: branch,
      ...(item.key === "reports_missing"
        ? {
            dateFrom: sample.label ?? undefined,
            dateTo: sample.label ?? undefined,
          }
        : { reportId: sample.record_id, reportBranchId: branch }),
    });
  const href = attentionHref(item.key, branch);
  if (
    sample.label &&
    [
      "stock_below_zero",
      "commissary_stock_below_zero",
      "branch_stock_low",
      "commissary_stock_low",
    ].includes(item.key)
  )
    return `${href}&search=${encodeURIComponent(sample.label)}`;
  return href;
}
