"use client";

import { DailyReportDeliveryHistory } from "./daily-report-deliveries";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { businessDayLong } from "@/features/shifts/services/shift-time";
import type {
  DailyReport,
  DailyReportReturnAction,
  DailyReportTransitionAction,
  DailyReportUpdateAction,
} from "@/features/daily-reports/types/daily-report.types";
import { DailyReportHistory } from "./daily-report-history";
import { DailyReportChecklist } from "./daily-report-checklist";
import { DailyReportItemEditor } from "./daily-report-item-editor";
import { DailyReportReviewControls } from "./daily-report-review-controls";
import { DailyReportSalesSummary } from "./daily-report-sales-summary";
import { DailyReportShifts } from "./daily-report-shifts";
import { DailyReportStatusBadge } from "./daily-report-status-badge";

const manilaTime = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function DailyReportDetail({
  branchId,
  branchName,
  report: initialReport,
  canUpdate,
  canPrepareSubmission,
  canSubmit,
  canApprove,
  canReturn,
  updateAction,
  submitAction,
  returnAction,
  approveAction,
}: {
  branchId: string;
  branchName: string;
  report: DailyReport;
  canUpdate: boolean;
  canPrepareSubmission: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReturn: boolean;
  updateAction: DailyReportUpdateAction;
  submitAction: DailyReportTransitionAction;
  returnAction: DailyReportReturnAction;
  approveAction: DailyReportTransitionAction;
}) {
  const router = useRouter();
  const [report, setReport] = useState(initialReport);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const handleDirtyChange = useCallback(
    (dirty: boolean) => setHasUnsavedChanges(dirty),
    [],
  );
  const isEditable = report.status === "DRAFT" || report.status === "RETURNED";
  const isSubmitted = report.status === "SUBMITTED";
  const reviewControls = (
    <DailyReportReviewControls
      branchId={branchId}
      report={report}
      canSubmit={canSubmit}
      canPrepareSubmission={canPrepareSubmission}
      canApprove={canApprove}
      canReturn={canReturn}
      hasUnsavedChanges={hasUnsavedChanges}
      submitAction={submitAction}
      returnAction={returnAction}
      approveAction={approveAction}
      onReportChange={setReport}
      placement={isSubmitted ? "header" : "panel"}
    />
  );

  function handleSaved(updatedReport: DailyReport) {
    setReport(updatedReport);
    setHasUnsavedChanges(false);
    router.refresh();
  }

  return (
    <section aria-labelledby="daily-report-detail-title" className="grid gap-6">
      <header
        className={cn(
          "flex flex-wrap items-start justify-between gap-4 border-b bg-background py-4",
          isSubmitted && (canApprove || canReturn) && "sticky top-0 z-20",
        )}
      >
        <div className="min-w-0">
          <h2 id="daily-report-detail-title" className="text-lg font-semibold">
            Daily report · {businessDayLong(report.business_date)}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{branchName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Created {manilaTime.format(new Date(report.created_at))}{" "}
            (Asia/Manila)
          </p>
        </div>
        <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:items-end">
          <DailyReportStatusBadge status={report.status} />
          {isSubmitted && reviewControls}
        </div>
      </header>

      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <Metadata
          label="Last updated"
          value={`${manilaTime.format(new Date(report.updated_at))} (Asia/Manila)`}
        />
        {report.submitted_at && (
          <Metadata
            label="Submitted"
            value={`${manilaTime.format(new Date(report.submitted_at))} (Asia/Manila)`}
          />
        )}
        {report.reviewed_at && (
          <Metadata
            label="Reviewed"
            value={`${manilaTime.format(new Date(report.reviewed_at))} (Asia/Manila)`}
          />
        )}
      </dl>
      <DailyReportSalesSummary report={report} />
      {canPrepareSubmission && isEditable && (
        <DailyReportChecklist
          branchId={branchId}
          report={report}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      )}
      <DailyReportShifts branchId={branchId} report={report} />
      {report.return_reason && (
        <p
          role="status"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
        >
          <span className="font-medium">Returned for correction:</span>{" "}
          {report.return_reason}
        </p>
      )}

      {report.items.length === 0 ? (
        <OperationalEmptyState
          title="No stock items to count"
          description="Sales are still included. Approving this report will not adjust inventory balances."
        />
      ) : (
        <DailyReportItemEditor
          branchId={branchId}
          reportId={report.id}
          items={report.items}
          canEdit={canUpdate && isEditable}
          action={updateAction}
          onSaved={handleSaved}
          onDirtyChange={handleDirtyChange}
        />
      )}

      <DailyReportDeliveryHistory report={report} />
      {!isSubmitted && reviewControls}
      <DailyReportHistory report={report} />
    </section>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium tabular-nums">{value}</dd>
    </div>
  );
}
