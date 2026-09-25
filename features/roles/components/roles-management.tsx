"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  OperationalEmptyState,
  OperationalPageIntro,
} from "@/components/shared/operational-page-ui";
import { RoleTable } from "@/features/roles/components/role-table";
import type { Role } from "@/features/roles/types/role.types";

export function RolesManagement({
  roles,
  canCreateRole,
  canUpdateRole,
  canUpdatePermissions,
  canDeactivateRole,
}: {
  roles: Role[];
  canCreateRole: boolean;
  canUpdateRole: boolean;
  canUpdatePermissions: boolean;
  canDeactivateRole: boolean;
}) {
  const router = useRouter();
  const activeCount = roles.filter((role) => role.is_active).length;

  return (
    <div className="flex flex-col gap-6">
      <OperationalPageIntro
        description="Define staff access with fixed permissions. System roles stay protected, and missing grants deny access."
        count={
          <div className="flex flex-wrap gap-2" aria-label="Role counts">
            <Badge variant="outline">{roles.length} roles</Badge>
            <Badge variant="outline">{activeCount} active</Badge>
          </div>
        }
        actions={
          canCreateRole ? (
            <Link
              href="/roles/new"
              className={buttonVariants()}
              aria-label="Create role"
            >
              Create role
            </Link>
          ) : undefined
        }
      />

      {roles.length === 0 ? (
        <OperationalEmptyState
          title="No roles available"
          description="There are no roles to display in this account scope."
          actions={
            canCreateRole ? (
              <Link href="/roles/new" className={buttonVariants()}>
                Create role
              </Link>
            ) : undefined
          }
        />
      ) : (
        <RoleTable
          roles={roles}
          canUpdateRole={canUpdateRole}
          canUpdatePermissions={canUpdatePermissions}
          canDeactivateRole={canDeactivateRole}
          onComplete={() => router.refresh()}
        />
      )}
    </div>
  );
}
