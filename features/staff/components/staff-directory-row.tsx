"use client";

import { useRef, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { StaffManagementSheet } from "@/features/staff/components/staff-management-sheet";
import type { Role } from "@/features/roles/types/role.types";
import type {
  StaffBranchOption,
  StaffManagementPermissions,
  StaffMember,
} from "@/features/staff/types/staff.types";

export function StaffDirectoryRow({
  staff,
  branchOptions,
  roles,
  rolesFailed,
  branchId,
  currentUserId,
  isSuperAdmin,
  permissions,
}: {
  staff: StaffMember;
  branchOptions: StaffBranchOption[];
  roles: Role[];
  rolesFailed: boolean;
  branchId?: string;
  currentUserId: string;
  isSuperAdmin: boolean;
  permissions: StaffManagementPermissions;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const branchNames = new Map(
    branchOptions.map((branch) => [branch.id, branch.name]),
  );
  const assignedBranches = staff.branch_ids.map(
    (id) => branchNames.get(id) ?? `Branch ${id.slice(0, 8)}`,
  );
  const isSelf = currentUserId === staff.id;
  const protectedTarget = staff.role_code === "SUPER_ADMIN" && !isSuperAdmin;
  const canManage = Boolean(
    permissions.canUpdate ||
    (!isSelf &&
      !protectedTarget &&
      (permissions.canAssignRole ||
        permissions.canAssignBranches ||
        (permissions.canDeactivate && staff.is_active))),
  );

  return (
    <>
      <TableRow>
        <TableCell className="max-w-72">
          <span className="block truncate font-medium" title={staff.full_name}>
            {staff.full_name}
          </span>
          <span
            className="block truncate text-xs text-muted-foreground"
            title={staff.email}
          >
            {staff.email}
          </span>
        </TableCell>
        <TableCell>{staff.role_name ?? "Unassigned"}</TableCell>
        <TableCell className="max-w-72">
          <span
            className="block truncate"
            title={assignedBranches.join(", ") || "None assigned"}
          >
            {assignedBranches.length > 0
              ? assignedBranches.join(", ")
              : "None assigned"}
          </span>
        </TableCell>
        <TableCell>{staff.contact_number}</TableCell>
        <TableCell>
          <Badge variant={staff.is_active ? "secondary" : "destructive"}>
            {staff.is_active ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex justify-end">
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
                <EllipsisVertical aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent data-coms-ui="operational" align="end">
                <DropdownMenuItem onClick={() => setOpen(true)}>
                  {canManage ? "Manage staff" : "View details"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      <StaffManagementSheet
        key={staff.id}
        staff={staff}
        branches={branchOptions}
        roles={roles}
        rolesFailed={rolesFailed}
        branchId={branchId}
        currentUserId={currentUserId}
        isSuperAdmin={isSuperAdmin}
        permissions={permissions}
        open={open}
        onOpenChange={setOpen}
        triggerRef={triggerRef}
      />
    </>
  );
}
