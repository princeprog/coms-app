"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RoleDetailsPanel } from "@/features/roles/components/role-details-panel";
import { RoleDiscardConfirmation } from "@/features/roles/components/role-discard-confirmation";
import { RolePermissionsPanel } from "@/features/roles/components/role-permissions-panel";
import {
  RoleWorkspace,
  RoleWorkspaceFooter,
  RoleWorkspaceGrid,
} from "@/features/roles/components/role-workspace";
import { useRoleDraftGuard } from "@/features/roles/hooks/use-role-draft-guard";
import type { Permission, Role } from "@/features/roles/types/role.types";

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
  const [selectedCount, setSelectedCount] = useState(
    role.permission_keys.length,
  );
  const canEditName = !role.is_system && role.is_active && canUpdateRole;
  const canEditPermissions =
    !role.is_system && role.is_active && canUpdatePermissions;
  const busy = namePending || permissionsPending;
  const guard = useRoleDraftGuard(nameDirty || permissionsDirty, busy);

  return (
    <RoleWorkspace
      title={canEditName || canEditPermissions ? "Edit role" : "View role"}
      description={
        canEditName || canEditPermissions
          ? "Define a role and choose its permissions."
          : "Review this role's details and permissions."
      }
      onBack={guard.requestLeave}
      pending={busy}
    >
      <RoleWorkspaceGrid>
        <RoleDetailsPanel
          role={role}
          selectedCount={selectedCount}
          canEditName={canEditName}
          disabled={busy}
          onComplete={() => router.refresh()}
          onDirtyChange={setNameDirty}
          onPendingChange={setNamePending}
        />
        <RolePermissionsPanel
          role={role}
          permissions={permissions}
          canUpdate={canEditPermissions}
          disabled={busy}
          onComplete={() => router.refresh()}
          onDirtyChange={setPermissionsDirty}
          onPendingChange={setPermissionsPending}
          onSelectedCountChange={setSelectedCount}
        />
      </RoleWorkspaceGrid>

      <RoleWorkspaceFooter className="justify-between">
        <p className="text-xs text-muted-foreground">
          {canEditName || canEditPermissions
            ? "Role name and permissions are saved independently."
            : "This role is read-only."}
        </p>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {canEditName || canEditPermissions ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={guard.requestLeave}
            >
              Cancel
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={guard.requestLeave}
            >
              Back to roles
            </Button>
          )}
          {canEditName && (
            <Button
              type="submit"
              form={`role-name-form-${role.id}`}
              variant={canEditPermissions ? "outline" : "default"}
              disabled={busy || !nameDirty}
            >
              {namePending ? "Saving role name…" : "Save role name"}
            </Button>
          )}
          {canEditPermissions && (
            <Button
              type="submit"
              form={`role-permissions-form-${role.id}`}
              variant="default"
              disabled={busy || !permissionsDirty}
            >
              {permissionsPending ? "Saving permissions…" : "Save permissions"}
            </Button>
          )}
        </div>
      </RoleWorkspaceFooter>

      <RoleDiscardConfirmation
        open={guard.confirmDiscard}
        onOpenChange={guard.setConfirmDiscard}
        onDiscard={guard.discardAndLeave}
      />
    </RoleWorkspace>
  );
}
