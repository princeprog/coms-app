import Link from "next/link";
import { OperationalPageIntro } from "@/components/shared/operational-page-ui";
import { buttonVariants } from "@/components/ui/button";
import { DailyReportCreateForm } from "@/features/daily-reports/components/daily-report-create-form";
import { DailyReportDetail } from "@/features/daily-reports/components/daily-report-detail";
import { DailyReportDirectoryToolbar } from "@/features/daily-reports/components/daily-report-directory-toolbar";
import { DailyReportList } from "@/features/daily-reports/components/daily-report-list";
import { createDailyReportHref } from "@/features/daily-reports/services/daily-report-page-params";
import {
  approveDailyReportAction,
  createDailyReportAction,
  returnDailyReportAction,
  submitDailyReportAction,
  updateDailyReportAction,
} from "@/features/daily-reports/services/daily-report-actions";
import type { DailyReportsViewResult } from "@/features/daily-reports/services/daily-report-page-loader";

type ReadyReportsView = Extract<DailyReportsViewResult, { status: "ready" }>;

export function DailyReportsManagement({ view }: { view: ReadyReportsView }) {
  const selected = Boolean(view.filters.reportId);
  const backHref = createDailyReportHref({
    branchId: view.filters.branchId,
    status: view.filters.status,
    page: view.filters.page,
  });

  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6">
      {selected ? (
        <>
          <Link
            href={backHref}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "w-fit",
            })}
          >
            Back to reports
          </Link>
          {view.selectedReport ? (
            <DailyReportDetail
              key={`${view.selectedReport.id}:${view.selectedReport.updated_at}`}
              branchId={view.selectedBranch.id}
              branchName={view.selectedBranch.name}
              report={view.selectedReport}
              canUpdate={view.canUpdate}
              canSubmit={view.canSubmit}
              canApprove={view.canApprove}
              canReturn={view.canReturn}
              updateAction={updateDailyReportAction}
              submitAction={submitDailyReportAction}
              returnAction={returnDailyReportAction}
              approveAction={approveDailyReportAction}
            />
          ) : (
            <div
              role={view.detailIssue === "unavailable" ? "alert" : "status"}
              className="rounded-lg border bg-card p-5"
            >
              <h2 className="text-lg font-semibold">
                {view.detailIssue === "unavailable"
                  ? "Report details unavailable"
                  : "Report unavailable"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {view.detailIssue === "unavailable"
                  ? "COMS could not load this report. Refresh the page to retry."
                  : "This report does not exist for the selected branch."}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <OperationalPageIntro
            description="Record physical counts and review ledger-derived expected stock for each branch. Business dates follow Asia/Manila."
            count={
              <span className="text-sm text-muted-foreground">
                {view.page.total} {view.page.total === 1 ? "report" : "reports"}
              </span>
            }
            actions={
              view.canCreate ? (
                <DailyReportCreateForm
                  branchId={view.selectedBranch.id}
                  todayManila={view.todayManila}
                  action={createDailyReportAction}
                />
              ) : null
            }
          />
          {view.selectedBranch.status === "inactive" && (
            <p
              role="status"
              className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground"
            >
              This branch is inactive. You can review its report history, but
              new reports and transitions are disabled.
            </p>
          )}
          <DailyReportDirectoryToolbar
            branches={view.branchOptions}
            filters={view.filters}
          />
          <DailyReportList page={view.page} filters={view.filters} />
        </>
      )}
    </div>
  );
}
