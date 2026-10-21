import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import {
  hasPermission,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { AuditLogWorkspace } from "@/features/audit/components/audit-log-workspace";

export default async function AuditLogPage() {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  const user = session.user;
  if (!isProtectedSuperAdmin(user) && !hasPermission(user, "audit.read"))
    notFound();
  return (
    <AppPageShell user={user}>
      <AuditLogWorkspace />
    </AppPageShell>
  );
}
