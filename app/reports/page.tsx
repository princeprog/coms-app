import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { DailyReportsManagement } from "@/features/daily-reports/components/daily-reports-management";
import { loadDailyReportsView } from "@/features/daily-reports/services/daily-report-page-loader";
import type { DailyReportPageSearchParams } from "@/features/daily-reports/services/daily-report-page-params";

function ReportsPageMessage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p role="alert" className="text-sm text-muted-foreground">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function DailyReportsPage({
  searchParams,
}: {
  searchParams: Promise<DailyReportPageSearchParams>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;

  const view = await loadDailyReportsView(session.user, await searchParams);
  if (view.status === "forbidden") notFound();
  if (view.status === "session-expired") redirect("/");
  if (view.status === "redirect") redirect(view.href);

  return (
    <AppPageShell user={session.user} title="Daily Reports">
      {view.status === "branch-options-error" ? (
        <ReportsPageMessage
          title="Branches unavailable"
          message="COMS could not load your branch choices. Refresh this page to try again."
        />
      ) : view.status === "branch-unavailable" ? (
        <ReportsPageMessage
          title="Branch unavailable"
          message="No branch is assigned to your account. Ask an administrator to assign one before using daily reports."
        />
      ) : view.status === "list-error" ? (
        <ReportsPageMessage
          title="Reports unavailable"
          message="COMS could not load daily reports for this branch. Refresh this page to retry."
        />
      ) : (
        <DailyReportsManagement view={view} />
      )}
    </AppPageShell>
  );
}
