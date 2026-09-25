"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  onSelectedCountChange,
}: {
  roleId: string;
  roleName: string;
  permissions: Permission[];
  initialPermissions: string[];
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
  const isDirty =
    selected.length !== savedPermissions.length ||
    selected.some((key) => !savedPermissions.includes(key));

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
          onSelectedCountChange(nextSelected.length);
          setStatus("");
          onDirtyChange(
            nextSelected.length !== savedPermissions.length ||
              nextSelected.some((key) => !savedPermissions.includes(key)),
          );
        }}
      />
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
      <div>
        <Button type="submit" variant="outline" disabled={pending || !isDirty}>
          {pending ? "Saving permissions…" : "Save permissions"}
        </Button>
      </div>
    </form>
  );
}
