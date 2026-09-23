"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deactivateRoleAction } from "@/features/roles/services/role-actions";
import type {
  Permission,
  Role,
  RoleMutationResult,
} from "@/features/roles/types/role.types";
import { RoleNameForm } from "@/features/roles/components/role-name-form";
import { RolePermissionsForm } from "@/features/roles/components/role-permissions-form";

export function RoleCard({
  role,
  permissions,
  canUpdateRole,
  canUpdatePermissions,
  canDeactivateRole,
  onComplete,
}: {
  role: Role;
  permissions: Permission[];
  canUpdateRole: boolean;
  canUpdatePermissions: boolean;
  canDeactivateRole: boolean;
  onComplete: () => void;
}) {
  const [confirmingDeactivation, setConfirmingDeactivation] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const canEdit = !role.is_system && role.is_active;

  function handleDialogOpenChange(open: boolean) {
    setConfirmingDeactivation(open);
    if (open) setError("");
  }

  async function deactivate() {
    setError("");
    setPending(true);
    let result: RoleMutationResult;
    try {
      result = await deactivateRoleAction(role.id);
    } catch {
      setPending(false);
      setError("COMS could not complete this change. Try again.");
      return;
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setConfirmingDeactivation(false);
    setStatus("Role deactivated.");
    onComplete();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{role.role_name}</CardTitle>
          {role.is_system && <Badge variant="secondary">System role</Badge>}
          <Badge variant={role.is_active ? "outline" : "destructive"}>
            {role.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="font-mono text-xs text-muted-foreground">{role.code}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {canEdit && canUpdateRole && (
          <RoleNameForm
            id={role.id}
            initialName={role.role_name}
            onComplete={onComplete}
          />
        )}
        {canEdit && canUpdatePermissions ? (
          <RolePermissionsForm
            roleId={role.id}
            roleName={role.role_name}
            permissions={permissions}
            initialPermissions={role.permission_keys}
            onComplete={onComplete}
          />
        ) : (
          <section aria-label={`Assigned permissions for ${role.role_name}`}>
            <h3 className="mb-2 text-sm font-medium">Granted permissions</h3>
            {role.permission_keys.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {role.permission_keys.map((key) => (
                  <li key={key}>
                    <Badge variant="outline">{key}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No permissions granted.
              </p>
            )}
          </section>
        )}
        {canEdit && canDeactivateRole && (
          <div className="flex flex-col items-start gap-2 border-t pt-4">
            <AlertDialog
              open={confirmingDeactivation}
              onOpenChange={handleDialogOpenChange}
            >
              <AlertDialogTrigger
                render={
                  <Button type="button" variant="destructive">
                    Deactivate role
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Deactivate {role.role_name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Staff must be reassigned before this role can be
                    deactivated.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={pending}>
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => void deactivate()}
                  >
                    {pending ? "Deactivating…" : "Confirm deactivation"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {status && (
              <p role="status" className="text-sm text-muted-foreground">
                {status}
              </p>
            )}
          </div>
        )}
        {!canEdit && role.is_system && (
          <p className="text-sm text-muted-foreground">
            System roles are protected.
          </p>
        )}
        {!canEdit && !role.is_system && (
          <p className="text-sm text-muted-foreground">
            This role is inactive.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
