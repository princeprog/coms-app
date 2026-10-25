"use client";

import { useRef, useState } from "react";
import {
  Ellipsis,
  UserRoundPen,
  ShieldCheck,
  Building2,
  KeyRound,
  UserRoundX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StaffEditDialog, type StaffEditAction } from "./staff-edit-dialog";
import { StaffPasswordResetControl } from "./staff-password-reset-control";
import { StaffDeactivateControl } from "./staff-deactivate-control";
import type { Role } from "@/features/roles/types/role.types";
import type {
  StaffBranchOption,
  StaffManagementPermissions,
  StaffMember,
} from "../types/staff.types";

export function StaffRowActions({
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
  const [action, setAction] = useState<
    StaffEditAction | "password" | "deactivate" | null
  >(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const canManage =
    currentUserId !== staff.id &&
    (staff.role_code !== "SUPER_ADMIN" || isSuperAdmin);
  const canAssignRole =
    canManage && permissions.canAssignRole && permissions.canReadRoles;
  const canAssignBranches =
    canManage &&
    permissions.canAssignBranches &&
    (!isSuperAdmin || permissions.canReadBranches);
  const canResetPassword =
    canManage && permissions.canResetPassword && staff.is_active;
  const canDeactivate =
    canManage && permissions.canDeactivate && staff.is_active;
  if (
    !permissions.canUpdate &&
    !canAssignRole &&
    !canAssignBranches &&
    !canResetPassword &&
    !canDeactivate
  )
    return null;
  const onClose = () => setAction(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              ref={triggerRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${staff.full_name}`}
            />
          }
        >
          <Ellipsis aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-coms-ui="operational"
          align="end"
          className="min-w-56"
        >
          {permissions.canUpdate && (
            <DropdownMenuItem onClick={() => setAction("profile")}>
              <UserRoundPen className="text-blue-600! dark:text-blue-400!" />
              Edit profile
            </DropdownMenuItem>
          )}
          {canAssignRole && (
            <DropdownMenuItem onClick={() => setAction("role")}>
              <ShieldCheck className="text-violet-600! dark:text-violet-400!" />
              Assign role
            </DropdownMenuItem>
          )}
          {canAssignBranches && (
            <DropdownMenuItem onClick={() => setAction("branches")}>
              <Building2 className="text-teal-600! dark:text-teal-400!" />
              Manage branch assignments
            </DropdownMenuItem>
          )}
          {canResetPassword && (
            <DropdownMenuItem onClick={() => setAction("password")}>
              <KeyRound className="text-amber-600! dark:text-amber-400!" />
              Reset password
            </DropdownMenuItem>
          )}
          {canDeactivate && (
            <>
              {(permissions.canUpdate ||
                canAssignRole ||
                canAssignBranches ||
                canResetPassword) && <DropdownMenuSeparator />}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setAction("deactivate")}
              >
                <UserRoundX />
                Deactivate staff
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {(action === "profile" || action === "role" || action === "branches") && (
        <StaffEditDialog
          key={action}
          action={action}
          staff={staff}
          branches={branches}
          roles={roles}
          rolesFailed={rolesFailed}
          branchId={branchId}
          triggerRef={triggerRef}
          onClose={onClose}
        />
      )}
      {action === "password" && (
        <StaffPasswordResetControl
          staff={staff}
          branchId={branchId}
          onClose={onClose}
          triggerRef={triggerRef}
        />
      )}
      {action === "deactivate" && (
        <StaffDeactivateControl
          staff={staff}
          branchId={branchId}
          onClose={onClose}
          triggerRef={triggerRef}
        />
      )}
    </>
  );
}
