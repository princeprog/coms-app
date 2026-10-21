import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { DashboardTodayWorkspace } from "@/features/dashboard/components/dashboard-today";

export default async function DashboardPage() {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  if (session.status === "recovering") return <SessionRecovery />;
  const user = session.user;
  if (
    !hasPermission(user, "dashboard.read") &&
    !hasPermission(user, "dashboard.global_read")
  )
    notFound();
  return (
    <AppPageShell user={user}>
      <DashboardTodayWorkspace
        canOpenReport={hasPermission(user, "sales_report.read")}
      />
    </AppPageShell>
  );
}
