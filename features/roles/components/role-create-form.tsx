"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SheetFooter } from "@/components/ui/sheet";
import { PermissionPicker } from "@/features/roles/components/permission-picker";
import { createRoleAction } from "@/features/roles/services/role-actions";
import type {
  Permission,
  RoleMutationResult,
} from "@/features/roles/types/role.types";

export function RoleCreateForm({
  permissions,
  onCancel,
  onComplete,
  onDirtyChange,
  onPendingChange,
}: {
  permissions: Permission[];
  onCancel: () => void;
  onComplete: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    onPendingChange(true);
    let result: RoleMutationResult;
    try {
      result = await createRoleAction({
        code,
        role_name: roleName,
        permission_keys: selectedPermissions,
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
    onDirtyChange(false);
    onComplete();
  }

  return (
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
      <FieldGroup className="flex-1 gap-5 overflow-y-auto p-6">
        <Field>
          <FieldLabel htmlFor="role-code">Role code</FieldLabel>
          <Input
            id="role-code"
            required
            minLength={2}
            maxLength={50}
            pattern="[A-Z0-9][A-Z0-9_-]{1,49}"
            autoCapitalize="characters"
            value={code}
            disabled={pending}
            onChange={(event) => {
              const nextCode = event.currentTarget.value.toUpperCase();
              setCode(nextCode);
              onDirtyChange(
                Boolean(nextCode || roleName || selectedPermissions.length),
              );
            }}
            placeholder="STOCK_MANAGER"
          />
          <FieldDescription>
            Use uppercase letters, numbers, underscores, or hyphens.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="role-name">Role name</FieldLabel>
          <Input
            id="role-name"
            required
            minLength={2}
            maxLength={160}
            value={roleName}
            disabled={pending}
            onChange={(event) => {
              const nextName = event.currentTarget.value;
              setRoleName(nextName);
              onDirtyChange(
                Boolean(code || nextName || selectedPermissions.length),
              );
            }}
            placeholder="Stock manager"
          />
        </Field>
        <PermissionPicker
          permissions={permissions}
          selected={selectedPermissions}
          labelPrefix="New role"
          disabled={pending}
          onChange={(nextPermissions) => {
            setSelectedPermissions(nextPermissions);
            onDirtyChange(Boolean(code || roleName || nextPermissions.length));
          }}
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </FieldGroup>
      <SheetFooter className="sticky bottom-0 mt-0 border-t bg-popover">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating role…" : "Create role"}
        </Button>
      </SheetFooter>
    </form>
  );
}
