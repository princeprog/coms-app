"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RoleDiscardConfirmation } from "@/features/roles/components/role-discard-confirmation";
import { RoleNameForm } from "@/features/roles/components/role-name-form";
import { RolePermissionsForm } from "@/features/roles/components/role-permissions-form";
import type { Permission, Role } from "@/features/roles/types/role.types";

export function RoleEditorSheet({
  role,
  permissions,
  canUpdateRole,
  canUpdatePermissions,
  onComplete,
  onClose,
}: {
  role: Role;
  permissions: Permission[];
  canUpdateRole: boolean;
  canUpdatePermissions: boolean;
  onComplete: () => void;
  onClose: () => void;
}) {
  const [nameDirty, setNameDirty] = useState(false);
  const [permissionsDirty, setPermissionsDirty] = useState(false);
  const [namePending, setNamePending] = useState(false);
  const [permissionsPending, setPermissionsPending] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const canEdit = !role.is_system && role.is_active;
  const isDirty = nameDirty || permissionsDirty;
  const isPending = namePending || permissionsPending;
  const grantedPermissions = permissions.filter((permission) =>
    role.permission_keys.includes(permission.key),
  );

  function requestClose() {
    if (isPending) return;
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }

  function discardChanges() {
    setConfirmDiscard(false);
    setNameDirty(false);
    setPermissionsDirty(false);
    onClose();
  }

  return (
    <Sheet open onOpenChange={(open) => !open && requestClose()}>
      <SheetContent
        data-coms-ui="operational"
        side="right"
        className="h-full w-full gap-0 overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader className="border-b">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle>{role.role_name}</SheetTitle>
            {role.is_system && <Badge variant="secondary">System role</Badge>}
            <Badge variant={role.is_active ? "outline" : "secondary"}>
              {role.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <SheetDescription>Role code: {role.code}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {canEdit && canUpdateRole ? (
            <section
              aria-labelledby="role-name-section"
              className="grid gap-4 rounded-lg border p-4"
            >
              <div>
                <h3 id="role-name-section" className="text-sm font-medium">
                  Role name
                </h3>
                <p className="text-sm text-muted-foreground">
                  The code cannot be changed after creation.
                </p>
              </div>
              <RoleNameForm
                id={role.id}
                initialName={role.role_name}
                onComplete={onComplete}
                onDirtyChange={setNameDirty}
                onPendingChange={setNamePending}
              />
            </section>
          ) : null}

          {canEdit && canUpdatePermissions ? (
            <section
              aria-labelledby="role-permissions-section"
              className="grid gap-4 rounded-lg border p-4"
            >
              <div>
                <h3
                  id="role-permissions-section"
                  className="text-sm font-medium"
                >
                  Permissions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Grant only the actions this role needs. Changes save
                  independently of the role name.
                </p>
              </div>
              <RolePermissionsForm
                roleId={role.id}
                roleName={role.role_name}
                permissions={permissions}
                initialPermissions={role.permission_keys}
                onComplete={onComplete}
                onDirtyChange={setPermissionsDirty}
                onPendingChange={setPermissionsPending}
              />
            </section>
          ) : (
            <section
              aria-label={`Assigned permissions for ${role.role_name}`}
              className="grid gap-3"
            >
              <h3 className="text-sm font-medium">Granted permissions</h3>
              {role.is_system && role.code === "SUPER_ADMIN" ? (
                <p className="text-sm text-muted-foreground">
                  This protected system role has global access across COMS.
                </p>
              ) : grantedPermissions.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {grantedPermissions.map((permission) => (
                    <li key={permission.key}>
                      <Badge variant="outline" title={permission.description}>
                        {permission.key}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No permissions granted.
                </p>
              )}
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
            </section>
          )}
        </div>

        <SheetFooter className="mt-0 border-t">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={requestClose}
          >
            Close editor
          </Button>
        </SheetFooter>
      </SheetContent>
      <RoleDiscardConfirmation
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        onDiscard={discardChanges}
      />
    </Sheet>
  );
}
