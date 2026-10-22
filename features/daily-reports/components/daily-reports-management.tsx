import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OperationalPageIntro } from "@/components/shared/operational-page-ui";
import { ExportCsvButton } from "@/features/exports/components/export-csv-button";
import { DailyReportCreateForm } from "@/features/daily-reports/components/daily-report-create-form";
import { DailyReportDetail } from "@/features/daily-reports/components/daily-report-detail";
import {
  createDailyReportHref,
  listFilters,
} from "@/features/daily-reports/services/daily-report-page-params";
import {
  approveDailyReportAction,
  createDailyReportAction,
  returnDailyReportAction,
  submitDailyReportAction,
  updateDailyReportAction,
} from "@/features/daily-reports/services/daily-report-actions";
import type {
  DailyReportsDetailView,
  DailyReportsListView,
} from "@/features/daily-reports/services/daily-report-page-loader";
import { DailyReportDirectoryView } from "./daily-report-directory-view";

function DetailPage({ view }: { view: DailyReportsDetailView }) {
  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6">
      <Link
        href={createDailyReportHref(listFilters(view.filters))}
        className="inline-flex min-h-9 w-fit items-center gap-2 rounded-md px-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to reports
      </Link>
      {view.selectedReport ? (
        <DailyReportDetail
          key={`${view.selectedReport.id}:${view.selectedReport.updated_at}`}
          branchId={view.selectedBranch.id}
          branchName={view.selectedBranch.name}
          report={view.selectedReport}
          canUpdate={view.canUpdate}
          canPrepareSubmission={view.canPrepareSubmission}
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
          className="rounded-xl border bg-card p-5"
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
    </div>
  );
}

export function DailyReportsManagement({
  view,
}: {
  view: DailyReportsListView | DailyReportsDetailView;
}) {
  if (view.status === "detail") return <DetailPage view={view} />;
  const { filters, directory } = view;
  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6">
      <OperationalPageIntro
        description="Stock counts, variances and sales from every branch."
        actions={
          <>
            {filters.branchId && directory.total > 0 && (
              <ExportCsvButton
                kind="daily-reports"
                label="Export report lines"
                params={{ branch_id: filters.branchId, status: filters.status }}
              />
            )}
            {view.createBranches.length > 0 && (
              <DailyReportCreateForm
                branches={view.createBranches}
                defaultBranchId={
                  view.createBranches.find(
                    (branch) => branch.id === filters.branchId,
                  )?.id ?? view.createBranches[0]!.id
                }
                todayManila={view.todayManila}
                action={createDailyReportAction}
              />
            )}
          </>
        }
      />
      <DailyReportDirectoryView
        filters={filters}
        branches={view.branchOptions}
        directory={directory}
      />
    </div>
  );
}
