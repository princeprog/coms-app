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
}: {
  roleId: string;
  roleName: string;
  permissions: Permission[];
  initialPermissions: string[];
  onComplete: () => void;
}) {
  const [selected, setSelected] = useState(initialPermissions);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    let result: RoleMutationResult;
    try {
      result = await replaceRolePermissionsAction(roleId, {
        permission_keys: selected,
      });
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
    onComplete();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <PermissionPicker
        permissions={permissions}
        selected={selected}
        labelPrefix={roleName}
        onChange={setSelected}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
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
