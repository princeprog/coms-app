"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { PermissionPicker } from "@/features/roles/components/permission-picker";
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
  onComplete,
  onDirtyChange,
  onPendingChange,
}: {
  roleId: string;
  roleName: string;
  permissions: Permission[];
  initialPermissions: string[];
  onComplete: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onPendingChange: (pending: boolean) => void;
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
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <PermissionPicker
        permissions={permissions}
        selected={selected}
        labelPrefix={roleName}
        disabled={pending}
        onChange={(nextSelected) => {
          setSelected(nextSelected);
          setStatus("");
          onDirtyChange(
            nextSelected.length !== savedPermissions.length ||
              nextSelected.some((key) => !savedPermissions.includes(key)),
          );
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      )}
      <div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving permissions…" : "Save permissions"}
        </Button>
      </div>
    </form>
  );
}
