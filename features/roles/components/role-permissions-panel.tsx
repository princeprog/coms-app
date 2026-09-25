"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PermissionPicker } from "@/features/roles/components/permission-picker";
import { RolePermissionsForm } from "@/features/roles/components/role-permissions-form";
import type { Permission, Role } from "@/features/roles/types/role.types";

export function RolePermissionsPanel({
  role,
  permissions,
  canUpdate,
  onComplete,
  onDirtyChange,
  onPendingChange,
}: {
  role: Role;
  permissions: Permission[];
  canUpdate: boolean;
  onComplete: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [selectedCount, setSelectedCount] = useState(
    role.permission_keys.length,
  );

  return (
    <Card className="min-w-0 lg:col-span-2">
      <CardHeader>
        <CardTitle>
          <h3 className="text-base font-semibold">Permissions</h3>
        </CardTitle>
        <CardDescription>
          {canUpdate
            ? "Grant only the actions this role needs. Changes save independently of its name."
            : "Review the fixed permission catalog for this role."}
        </CardDescription>
        <CardAction>
          <Badge variant="outline" aria-live="polite">
            {selectedCount} selected
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {canUpdate ? (
          <RolePermissionsForm
            roleId={role.id}
            roleName={role.role_name}
            permissions={permissions}
            initialPermissions={role.permission_keys}
            onComplete={onComplete}
            onDirtyChange={onDirtyChange}
            onPendingChange={onPendingChange}
            onSelectedCountChange={setSelectedCount}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {role.code === "SUPER_ADMIN" ? (
              <p className="text-sm font-medium">Global access across COMS.</p>
            ) : role.code === "NO_ACCESS" ? (
              <p className="text-sm font-medium">This role has no grants.</p>
            ) : role.permission_keys.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No permissions are granted to this role.
              </p>
            ) : null}
            <PermissionPicker
              permissions={permissions}
              selected={role.permission_keys}
              labelPrefix={role.role_name}
              onChange={() => {}}
              disabled
            />
            {role.is_system && (
              <p className="text-sm text-muted-foreground">
                System roles are protected.
              </p>
            )}
            {!role.is_system && !role.is_active && (
              <p className="text-sm text-muted-foreground">
                This role is inactive.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
