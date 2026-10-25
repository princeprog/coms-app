import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { loadSchedulePageAccess } from "@/features/schedules/services/schedule-page-loader";
import { getBusinessDay } from "@/features/business-day/services/business-day-queries";
import { ShiftTemplatesWorkspace } from "@/features/schedules/components/shift-templates-workspace";

export default async function ShiftTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  const branch = (await searchParams).branch;
  const access = await loadSchedulePageAccess(
    session.user,
    Array.isArray(branch) ? branch[0] : branch,
  );
  if (access.status === "forbidden") notFound();
  if (access.status === "session-expired") redirect("/");
  let dayStartTimes = ["00:00"];
  try {
    const settings = await getBusinessDay();
    dayStartTimes = [
      settings.current.start_time,
      ...(settings.scheduled ? [settings.scheduled.start_time] : []),
    ];
  } catch {
    // The API still rejects shifts that cross the day start.
  }
  return (
    <AppPageShell user={session.user}>
      {access.status === "ready" ? (
        <ShiftTemplatesWorkspace
          key={access.selectedBranchId}
          branches={access.branches}
          branchId={access.selectedBranchId}
          canManage={access.canManage}
          dayStartTimes={dayStartTimes}
        />
      ) : access.status === "branch-unavailable" ? (
        <OperationalEmptyState
          title="No branch assigned"
          description="Ask an administrator to assign a branch before setting up shifts."
        />
      ) : (
        <CatalogLoadError title="branches" />
      )}
    </AppPageShell>
  );
}
