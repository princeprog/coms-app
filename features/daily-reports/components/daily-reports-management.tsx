import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyReportCreateForm } from "@/features/daily-reports/components/daily-report-create-form";
import { DailyReportDetail } from "@/features/daily-reports/components/daily-report-detail";
import { DailyReportList } from "@/features/daily-reports/components/daily-report-list";
import { dailyReportRoute } from "@/features/daily-reports/constants";
import {
  createDailyReportAction,
  approveDailyReportAction,
  returnDailyReportAction,
  submitDailyReportAction,
  updateDailyReportAction,
} from "@/features/daily-reports/services/daily-report-actions";
import type { DailyReportsViewResult } from "@/features/daily-reports/services/daily-report-page-loader";

type ReadyReportsView = Extract<DailyReportsViewResult, { status: "ready" }>;

export function DailyReportsManagement({ view }: { view: ReadyReportsView }) {
  const { branchOptions, selectedBranch, filters } = view;
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Record physical counts and review ledger-derived expected stock for each
        branch. All report cutoffs use Asia/Manila business dates.
      </p>

      <form
        action={dailyReportRoute}
        method="get"
        aria-label="Choose report branch"
        className="grid gap-3 rounded-4xl border bg-card p-4 sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-end"
      >
        <input type="hidden" name="status" value={filters.status} />
        <div className="flex flex-col gap-2">
          <label htmlFor="daily-report-branch" className="text-sm font-medium">
            Branch
          </label>
          <select
            id="daily-report-branch"
            name="branch_id"
            defaultValue={selectedBranch.id}
            className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
                {branch.status === "inactive" ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">
          Open branch
        </Button>
      </form>

      {view.canCreate ? (
        <DailyReportCreateForm
          key={selectedBranch.id}
          branchId={selectedBranch.id}
          todayManila={view.todayManila}
          action={createDailyReportAction}
        />
      ) : selectedBranch.status === "inactive" ? (
        <p role="status" className="rounded-3xl border p-4 text-sm">
          This branch is inactive. You can review its report history, but new
          reports and transitions are disabled.
        </p>
      ) : null}

      <DailyReportList page={view.page} filters={filters} />

      {filters.reportId && view.detailIssue === "not-found" && (
        <ReportMessage title="Report unavailable">
          This report does not exist for the selected branch.
        </ReportMessage>
      )}
      {filters.reportId && view.detailIssue === "unavailable" && (
        <ReportMessage title="Report details unavailable" role="alert">
          COMS could not load this report. Refresh the page to retry.
        </ReportMessage>
      )}
      {view.selectedReport && (
        <DailyReportDetail
          key={`${view.selectedReport.id}:${view.selectedReport.updated_at}`}
          branchId={selectedBranch.id}
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
      )}
    </div>
  );
}

function ReportMessage({
  title,
  role,
  children,
}: {
  title: string;
  role?: "alert";
  children: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p role={role} className="text-sm text-muted-foreground">
          {children}
        </p>
      </CardContent>
    </Card>
  );
}
