import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { RoleAdminLoadError } from "@/features/roles/components/role-admin-load-error";
import { RoleCreatePage } from "@/features/roles/components/role-create-page";
import { hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { ApiRequestError } from "@/services/api-services";
import { getRolePermissions } from "@/features/roles/services/role-queries";
import type { Permission } from "@/features/roles/types/role.types";

export default async function NewRolePage() {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return (
      <section role="alert" className="m-4 grid gap-2 rounded-lg border p-6">
        <h2 className="font-semibold">Roles are unavailable</h2>
        <p className="text-sm text-muted-foreground">
          COMS could not verify your session. Try again in a moment.
        </p>
      </section>
    );
  }
  if (
    !hasPermission(session.user, "roles.read") ||
    !hasPermission(session.user, "roles.create")
  ) {
    notFound();
  }

  let permissions: Permission[];
  try {
    permissions = await getRolePermissions();
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
    return (
      <AppPageShell user={session.user}>
        <RoleAdminLoadError
          title="Unable to load role permissions"
          message="COMS could not load the permission catalog. Your changes have not been affected."
        />
      </AppPageShell>
    );
  }
  return (
    <AppPageShell user={session.user} fillViewport>
      <RoleCreatePage permissions={permissions} />
    </AppPageShell>
  );
}
