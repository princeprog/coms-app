"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OperationalEmptyState,
  OperationalStatusBadge,
} from "@/components/shared/operational-page-ui";
import type {
  DailyReport,
  DailyReportReturnAction,
  DailyReportTransitionAction,
  DailyReportUpdateAction,
} from "@/features/daily-reports/types/daily-report.types";
import { DailyReportHistory } from "./daily-report-history";
import { DailyReportItemEditor } from "./daily-report-item-editor";
import { DailyReportReviewControls } from "./daily-report-review-controls";

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

  function handleSaved(updatedReport: DailyReport) {
    setReport(updatedReport);
    setHasUnsavedChanges(false);
    router.refresh();
  }

  return (
    <section aria-labelledby="daily-report-detail-title" className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div>
          <h2 id="daily-report-detail-title" className="text-lg font-semibold">
            Daily report · {report.business_date}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{branchName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Created {manilaTime.format(new Date(report.created_at))}{" "}
            (Asia/Manila)
          </p>
        </div>
        <OperationalStatusBadge variant={statusVariant(report.status)}>
          {report.status.replaceAll("_", " ")}
        </OperationalStatusBadge>
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
          description="This report has no stock items in its saved snapshot."
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

      <DailyReportReviewControls
        branchId={branchId}
        report={report}
        canSubmit={canSubmit}
        canApprove={canApprove}
        canReturn={canReturn}
        hasUnsavedChanges={hasUnsavedChanges}
        submitAction={submitAction}
        returnAction={returnAction}
        approveAction={approveAction}
        onReportChange={setReport}
      />
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

function statusVariant(status: DailyReport["status"]) {
  if (status === "RETURNED") return "destructive" as const;
  if (status === "APPROVED") return "secondary" as const;
  return "outline" as const;
}
