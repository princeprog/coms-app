"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { RoleDiscardConfirmation } from "@/features/roles/components/role-discard-confirmation";
import { RoleNameForm } from "@/features/roles/components/role-name-form";
import { RolePermissionsPanel } from "@/features/roles/components/role-permissions-panel";
import { useRoleDraftGuard } from "@/features/roles/hooks/use-role-draft-guard";
import type { Permission, Role } from "@/features/roles/types/role.types";
import { useRouter } from "next/navigation";

export function RoleEditorPage({
  role,
  permissions,
  canUpdateRole,
  canUpdatePermissions,
}: {
  role: Role;
  permissions: Permission[];
  canUpdateRole: boolean;
  canUpdatePermissions: boolean;
}) {
  const router = useRouter();
  const [nameDirty, setNameDirty] = useState(false);
  const [permissionsDirty, setPermissionsDirty] = useState(false);
  const [namePending, setNamePending] = useState(false);
  const [permissionsPending, setPermissionsPending] = useState(false);
  const canEditName = !role.is_system && role.is_active && canUpdateRole;
  const canEditPermissions =
    !role.is_system && role.is_active && canUpdatePermissions;
  const guard = useRoleDraftGuard(
    nameDirty || permissionsDirty,
    namePending || permissionsPending,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{role.role_name}</h2>
            <Badge variant={role.is_system ? "secondary" : "outline"}>
              {role.is_system
                ? "System"
                : role.is_predefined
                  ? "Predefined"
                  : "Custom"}
            </Badge>
            <Badge variant={role.is_active ? "outline" : "secondary"}>
              {role.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Role code: {role.code}
          </p>
          {role.is_predefined && (
            <p className="text-xs text-muted-foreground">
              Permission changes apply to everyone assigned to this role.
            </p>
          )}
        </div>
        <Link
          href="/roles"
          aria-disabled={namePending || permissionsPending}
          className={buttonVariants({ variant: "outline" })}
          onClick={(event) => {
            event.preventDefault();
            guard.requestLeave();
          }}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to roles
        </Link>
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 className="text-base font-semibold">Role details</h3>
            </CardTitle>
            <CardDescription>
              Role code is permanent. Role name changes apply to staff
              assignments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canEditName ? (
              <RoleNameForm
                id={role.id}
                initialName={role.role_name}
                onComplete={() => router.refresh()}
                onDirtyChange={setNameDirty}
                onPendingChange={setNamePending}
              />
            ) : (
              <FieldGroup className="gap-5">
                <Field>
                  <FieldLabel>Role name</FieldLabel>
                  <p className="text-sm font-medium">{role.role_name}</p>
                </Field>
                <Field>
                  <FieldLabel>Role code</FieldLabel>
                  <p className="font-mono text-sm">{role.code}</p>
                </Field>
                {role.is_system && (
                  <FieldDescription>
                    System roles are protected.
                  </FieldDescription>
                )}
                {!role.is_active && !role.is_system && (
                  <FieldDescription>This role is inactive.</FieldDescription>
                )}
              </FieldGroup>
            )}
          </CardContent>
        </Card>

        <RolePermissionsPanel
          role={role}
          permissions={permissions}
          canUpdate={canEditPermissions}
          onComplete={() => router.refresh()}
          onDirtyChange={setPermissionsDirty}
          onPendingChange={setPermissionsPending}
        />
      </div>

      <RoleDiscardConfirmation
        open={guard.confirmDiscard}
        onOpenChange={guard.setConfirmDiscard}
        onDiscard={guard.discardAndLeave}
      />
    </div>
  );
}
