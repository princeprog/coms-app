"use client";

import { StaffBranchAssignmentForm } from "@/features/staff/components/staff-branch-assignment-form";
import { StaffDeactivateControl } from "@/features/staff/components/staff-deactivate-control";
import { StaffProfileForm } from "@/features/staff/components/staff-profile-form";
import { StaffRoleForm } from "@/features/staff/components/staff-role-form";
import type { Role } from "@/features/roles/types/role.types";
import type {
  StaffBranchOption,
  StaffManagementPermissions,
  StaffMember,
} from "@/features/staff/types/staff.types";

export function StaffMemberActions({
  staff,
  branches,
  roles,
  rolesFailed,
  branchId,
  currentUserId,
  isSuperAdmin,
  permissions,
}: {
  staff: StaffMember;
  branches: StaffBranchOption[];
  roles: Role[];
  rolesFailed: boolean;
  branchId?: string;
  currentUserId: string;
  isSuperAdmin: boolean;
  permissions: StaffManagementPermissions;
}) {
  const isSelf = currentUserId === staff.id;
  const protectedTarget = staff.role_code === "SUPER_ADMIN" && !isSuperAdmin;
  const canManageTarget = !isSelf && !protectedTarget;
  const canEditBranches =
    permissions.canAssignBranches &&
    canManageTarget &&
    !(isSuperAdmin && !permissions.canReadBranches);
  const canManageRole = permissions.canAssignRole && canManageTarget;
  const canDeactivate =
    permissions.canDeactivate && canManageTarget && staff.is_active;
  const showBranchNotice =
    permissions.canAssignBranches && canManageTarget && !canEditBranches;

  if (
    !permissions.canUpdate &&
    !canManageRole &&
    !canEditBranches &&
    !showBranchNotice &&
    !canDeactivate
  ) {
    return null;
  }

  return (
    <section
      aria-label={`Actions for ${staff.full_name}`}
      className="flex flex-col gap-3 border-t pt-4"
    >
      {permissions.canUpdate && (
        <StaffProfileForm staff={staff} branchId={branchId} />
      )}
      {canManageRole &&
        (permissions.canReadRoles ? (
          <StaffRoleForm
            staff={staff}
            branchId={branchId}
            roles={roles}
            rolesFailed={rolesFailed}
          />
        ) : (
          <p role="status" className="text-sm text-muted-foreground">
            Role changes require access to read the role catalog.
          </p>
        ))}
      {canEditBranches && (
        <StaffBranchAssignmentForm
          staff={staff}
          branchId={branchId}
          branches={branches}
        />
      )}
      {showBranchNotice && (
        <p role="status" className="text-sm text-muted-foreground">
          Branch changes require access to read active branches.
        </p>
      )}
      {canDeactivate && (
        <StaffDeactivateControl staff={staff} branchId={branchId} />
      )}
    </section>
  );
}
