import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { RoleAdminLoadError } from "@/features/roles/components/role-admin-load-error";
import { RoleEditorPage } from "@/features/roles/components/role-editor-page";
import { hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { ApiRequestError } from "@/services/api-services";
import { getRoleAdminData } from "@/features/roles/services/role-queries";

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
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
  if (!hasPermission(session.user, "roles.read")) notFound();

  const { roleId } = await params;
  if (!/^[1-9]\d{0,18}$/.test(roleId)) notFound();

  let roleData: Awaited<ReturnType<typeof getRoleAdminData>>;
  try {
    roleData = await getRoleAdminData();
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
    return (
      <AppPageShell user={session.user}>
        <RoleAdminLoadError
          title="Unable to load role"
          message="COMS could not load role details and permissions. Your changes have not been affected."
        />
      </AppPageShell>
    );
  }
  const role = roleData.roles.find((item) => item.id === roleId);
  if (!role) notFound();
  return (
    <AppPageShell user={session.user} fillViewport>
      <RoleEditorPage
        role={role}
        permissions={roleData.permissions}
        canUpdateRole={hasPermission(session.user, "roles.update")}
        canUpdatePermissions={hasPermission(
          session.user,
          "roles.permissions_update",
        )}
      />
    </AppPageShell>
  );
}
