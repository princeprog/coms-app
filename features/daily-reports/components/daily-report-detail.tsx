"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const isEditable = report.status === "DRAFT" || report.status === "RETURNED";
  function handleSaved(updatedReport: DailyReport) {
    setReport(updatedReport);
    router.refresh();
  }

  return (
    <section aria-labelledby="daily-report-detail-title" className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle id="daily-report-detail-title">
              Daily report · {report.business_date}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Created {manilaTime.format(new Date(report.created_at))}{" "}
              (Asia/Manila)
            </p>
          </div>
          <Badge variant={statusVariant(report.status)}>
            {report.status.replaceAll("_", " ")}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            Last updated {manilaTime.format(new Date(report.updated_at))}{" "}
            (Asia/Manila)
          </p>
          {report.submitted_at && (
            <p>
              Submitted {manilaTime.format(new Date(report.submitted_at))}{" "}
              (Asia/Manila)
            </p>
          )}
          {report.reviewed_at && (
            <p>
              Reviewed {manilaTime.format(new Date(report.reviewed_at))}{" "}
              (Asia/Manila)
            </p>
          )}
          {report.return_reason && (
            <p role="status" className="rounded-3xl border p-3 sm:col-span-2">
              <span className="font-medium">Returned for correction:</span>{" "}
              {report.return_reason}
            </p>
          )}
        </CardContent>
      </Card>

      {report.items.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            This report has no stock items to count.
          </CardContent>
        </Card>
      ) : (
        <DailyReportItemEditor
          branchId={branchId}
          reportId={report.id}
          items={report.items}
          canEdit={canUpdate && isEditable}
          action={updateAction}
          onSaved={handleSaved}
        />
      )}

      <DailyReportReviewControls
        branchId={branchId}
        report={report}
        canSubmit={canSubmit}
        canApprove={canApprove}
        canReturn={canReturn}
        submitAction={submitAction}
        returnAction={returnAction}
        approveAction={approveAction}
        onReportChange={setReport}
      />
      <DailyReportHistory report={report} />
    </section>
  );
}

function statusVariant(status: DailyReport["status"]) {
  if (status === "RETURNED") return "destructive" as const;
  if (status === "APPROVED") return "secondary" as const;
  return "outline" as const;
}
