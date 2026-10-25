import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { loadSchedulePageAccess } from "@/features/schedules/services/schedule-page-loader";
import { ScheduleWorkspace } from "@/features/schedules/components/schedule-workspace";
import {
  isWeekStart,
  weekStartOf,
} from "@/features/schedules/services/schedule-format";

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  const params = await searchParams;
  const access = await loadSchedulePageAccess(
    session.user,
    first(params.branch),
  );
  if (access.status === "forbidden") notFound();
  if (access.status === "session-expired") redirect("/");
  const week = first(params.week);
  return (
    <AppPageShell user={session.user}>
      {access.status === "ready" ? (
        <ScheduleWorkspace
          key={access.selectedBranchId}
          branches={access.branches}
          branchId={access.selectedBranchId}
          week={isWeekStart(week) ? weekStartOf(week) : ""}
          canManage={access.canManage}
        />
      ) : access.status === "branch-unavailable" ? (
        <OperationalEmptyState
          title="No branch assigned"
          description="Ask an administrator to assign a branch before viewing schedules."
        />
      ) : (
        <CatalogLoadError title="branches" />
      )}
    </AppPageShell>
  );
}
