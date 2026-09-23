"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RoleCard } from "@/features/roles/components/role-card";
import { RoleCreateForm } from "@/features/roles/components/role-create-form";
import type { Permission, Role } from "@/features/roles/types/role.types";

export function RolesManagement({
  roles,
  permissions,
  canCreateRole,
  canUpdateRole,
  canUpdatePermissions,
  canDeactivateRole,
}: {
  roles: Role[];
  permissions: Permission[];
  canCreateRole: boolean;
  canUpdateRole: boolean;
  canUpdatePermissions: boolean;
  canDeactivateRole: boolean;
}) {
  const router = useRouter();
  const activeCount = roles.filter((role) => role.is_active).length;
  const refresh = () => router.refresh();

  return (
    <div className="flex flex-col gap-6">
      <section
        className="flex flex-wrap items-center justify-between gap-4"
        aria-label="Role summary"
      >
        <p className="max-w-2xl text-sm text-muted-foreground">
          Define staff access with fixed permissions. System roles stay
          protected, and missing grants deny access.
        </p>
        <div className="flex gap-2">
          <Badge variant="outline">{roles.length} roles</Badge>
          <Badge variant="outline">{activeCount} active</Badge>
        </div>
      </section>

      {canCreateRole && (
        <RoleCreateForm permissions={permissions} onComplete={refresh} />
      )}

      <section
        aria-labelledby="role-directory-heading"
        className="flex flex-col gap-4"
      >
        <div>
          <h2 id="role-directory-heading" className="text-lg font-semibold">
            Role directory
          </h2>
          <p className="text-sm text-muted-foreground">
            {roles.length} configured {roles.length === 1 ? "role" : "roles"}
          </p>
        </div>
        {roles.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                permissions={permissions}
                canUpdateRole={canUpdateRole}
                canUpdatePermissions={canUpdatePermissions}
                canDeactivateRole={canDeactivateRole}
                onComplete={refresh}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="font-medium">No roles are available.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a role after the system role setup is restored.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
