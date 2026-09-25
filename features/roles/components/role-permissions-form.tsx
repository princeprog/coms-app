"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RolePermissionPicker } from "@/features/roles/components/role-permission-picker";
import { replaceRolePermissionsAction } from "@/features/roles/services/role-actions";
import type {
  Permission,
  RoleMutationResult,
} from "@/features/roles/types/role.types";

export function RolePermissionsForm({
  roleId,
  roleName,
  permissions,
  initialPermissions,
  disabled,
  onComplete,
  onDirtyChange,
  onPendingChange,
  onSelectedCountChange,
}: {
  roleId: string;
  roleName: string;
  permissions: Permission[];
  initialPermissions: string[];
  disabled: boolean;
  onComplete: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onPendingChange: (pending: boolean) => void;
  onSelectedCountChange: (count: number) => void;
}) {
  const [selected, setSelected] = useState(initialPermissions);
  const [savedPermissions, setSavedPermissions] = useState(initialPermissions);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setPending(true);
    onPendingChange(true);
    let result: RoleMutationResult;
    try {
      result = await replaceRolePermissionsAction(roleId, {
        permission_keys: selected,
      });
    } catch {
      setPending(false);
      onPendingChange(false);
      setError("COMS could not complete this change. Try again.");
      return;
    }
    setPending(false);
    onPendingChange(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSavedPermissions(selected);
    onDirtyChange(false);
    setStatus("Permissions updated.");
    onComplete();
  }

  return (
    <form
      id={`role-permissions-form-${roleId}`}
      className="flex min-h-0 flex-1 flex-col gap-2"
      onSubmit={submit}
    >
      <div className="min-h-0 flex-1">
        <RolePermissionPicker
          permissions={permissions}
          selected={selected}
          labelPrefix={roleName}
          idPrefix={`role-${roleId}`}
          disabled={disabled || pending}
          onChange={(nextSelected) => {
            setSelected(nextSelected);
            onSelectedCountChange(nextSelected.length);
            setStatus("");
            onDirtyChange(
              nextSelected.length !== savedPermissions.length ||
                nextSelected.some((key) => !savedPermissions.includes(key)),
            );
          }}
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Permissions were not saved</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {status && (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      )}
    </form>
  );
}
