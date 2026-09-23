import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { ApiRequestError } from "@/services/api-services";
import { RolesManagement } from "@/features/roles/components/roles-management";
import { getRoleAdminData } from "@/features/roles/services/role-queries";

export default async function RolesPage() {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
        <section role="alert" className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold">Roles are unavailable</h1>
          <p className="text-sm text-muted-foreground">
            COMS could not verify your session. Try again in a moment.
          </p>
        </section>
      </main>
    );
  }

  if (!hasPermission(session.user, "roles.read")) notFound();

  let data;
  try {
    data = await getRoleAdminData();
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
    return (
      <AppPageShell user={session.user} title="Roles and permissions">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load roles</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              COMS could not load the role catalog. Your changes have not been
              affected.
            </p>
            <form>
              <Button type="submit" variant="outline">
                Try again
              </Button>
            </form>
          </CardContent>
        </Card>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell user={session.user} title="Roles and permissions">
      <RolesManagement
        roles={data.roles}
        permissions={data.permissions}
        canCreateRole={hasPermission(session.user, "roles.create")}
        canUpdateRole={hasPermission(session.user, "roles.update")}
        canUpdatePermissions={hasPermission(
          session.user,
          "roles.permissions_update",
        )}
        canDeactivateRole={hasPermission(session.user, "roles.deactivate")}
      />
    </AppPageShell>
  );
}
