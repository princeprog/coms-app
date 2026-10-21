import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import {
  hasPermission,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CostsWorkspace } from "@/features/costs/components/costs-workspace";

export default async function CostsPage() {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  const user = session.user;
  const superAdmin = isProtectedSuperAdmin(user);
  if (!superAdmin && !hasPermission(user, "costs.read")) notFound();
  return (
    <AppPageShell user={user}>
      <CostsWorkspace
        canManage={superAdmin || hasPermission(user, "costs.manage")}
      />
    </AppPageShell>
  );
}
