"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  onComplete,
}: {
  roles: Role[];
  canUpdateRole: boolean;
  canUpdatePermissions: boolean;
  canDeactivateRole: boolean;
  onComplete: () => void;
}) {
  return (
    <section aria-label="Role directory" className="min-w-0">
      <Card className="gap-0 py-0">
        <CardHeader className="gap-1 border-b px-5 py-4">
          <h2 className="text-base font-semibold">Role directory</h2>
          <p className="text-xs text-muted-foreground">
            Use the action menu to view or manage a role.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table
            className="min-w-[620px]"
            containerProps={{
              role: "region",
              "aria-label": "Role table",
              tabIndex: 0,
              className:
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
            }}
          >
            <TableCaption className="sr-only">
              Roles and their access summary
            </TableCaption>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-2/5 pl-5">Role</TableHead>
                <TableHead className="w-1/5">Type</TableHead>
                <TableHead className="w-1/5">Access</TableHead>
                <TableHead className="w-1/5">Status</TableHead>
                <TableHead className="w-14 pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} className="focus-within:bg-muted/30">
                  <TableCell className="min-w-52 py-3.5 pl-5 whitespace-normal">
                    <span className="font-semibold text-foreground break-words">
                      {role.role_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    {role.is_system ? (
                      <Badge variant="secondary">System</Badge>
                    ) : role.is_predefined ? (
                      <Badge variant="outline">Predefined</Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
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
                  <TableCell className="pr-5 text-right">
                    <RoleDirectoryActions
                      role={role}
                      canManage={canManageRole(
                        role,
                        canUpdateRole,
                        canUpdatePermissions,
                      )}
                      canDeactivate={canDeactivateRole}
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
