"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleDirectoryActions } from "@/features/roles/components/role-directory-actions";
import type { Role } from "@/features/roles/types/role.types";

export function RoleTable({
  roles,
  canUpdateRole,
  canUpdatePermissions,
  canDeactivateRole,
  onOpen,
  onComplete,
}: {
  roles: Role[];
  canUpdateRole: boolean;
  canUpdatePermissions: boolean;
  canDeactivateRole: boolean;
  onOpen: (role: Role, trigger: HTMLButtonElement | null) => void;
  onComplete: () => void;
}) {
  return (
    <section aria-label="Role directory" className="min-w-0">
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableCaption className="sr-only">
              Roles and their access summary
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="min-w-48">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto justify-start px-0 font-medium text-foreground"
                      onClick={(event) => onOpen(role, event.currentTarget)}
                      aria-label={`${canManageRole(role, canUpdateRole, canUpdatePermissions) ? "Manage" : "View"} ${role.role_name}`}
                    >
                      {role.role_name}
                    </Button>
                    <p className="font-mono text-xs text-muted-foreground">
                      {role.code}
                    </p>
                  </TableCell>
                  <TableCell>
                    {role.is_system ? (
                      <Badge variant="secondary">System role</Badge>
                    ) : (
                      <span className="text-muted-foreground">Custom</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {role.is_system && role.code === "SUPER_ADMIN"
                      ? "Global access"
                      : role.permission_keys.length === 0
                        ? "No permissions"
                        : `${role.permission_keys.length} ${role.permission_keys.length === 1 ? "permission" : "permissions"}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.is_active ? "outline" : "secondary"}>
                      {role.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <RoleDirectoryActions
                      role={role}
                      canManage={canManageRole(
                        role,
                        canUpdateRole,
                        canUpdatePermissions,
                      )}
                      canDeactivate={canDeactivateRole}
                      onOpen={(trigger) => onOpen(role, trigger)}
                      onComplete={onComplete}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}

function canManageRole(
  role: Role,
  canUpdateRole: boolean,
  canUpdatePermissions: boolean,
) {
  return (
    !role.is_system && role.is_active && (canUpdateRole || canUpdatePermissions)
  );
}
