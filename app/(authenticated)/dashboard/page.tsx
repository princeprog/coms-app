import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import {
  hasPermission,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { DashboardWorkspace } from "@/features/dashboard/components/dashboard-workspace";
import { getDashboardDateRange } from "@/features/dashboard/services/dashboard-date-range";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ branch_id?: string | string[] }>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;

  const user = session.user;
  const canViewDashboard =
    isProtectedSuperAdmin(user) ||
    hasPermission(user, "dashboard.read") ||
    hasPermission(user, "dashboard.global_read");
  if (!canViewDashboard) notFound();

  const params = await searchParams;
  const rawBranchId = Array.isArray(params.branch_id)
    ? params.branch_id[0]
    : params.branch_id;
  if (
    rawBranchId &&
    !isProtectedSuperAdmin(user) &&
    !hasPermission(user, "dashboard.global_read") &&
    !(user.branch_ids ?? []).includes(rawBranchId)
  ) {
    notFound();
  }

  return (
    <AppPageShell user={user}>
      <DashboardWorkspace
        user={user}
        requestedBranchId={rawBranchId}
        initialRange={getDashboardDateRange(30)}
      />
    </AppPageShell>
  );
}
