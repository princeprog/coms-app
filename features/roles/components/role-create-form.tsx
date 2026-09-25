"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
import { Input } from "@/components/ui/input";
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

  function updateDirty(nextCode: string, nextName: string, grants: string[]) {
    onDirtyChange(Boolean(nextCode || nextName || grants.length));
  }

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
      result = {
        ok: false,
        error: "COMS could not complete this change. Try again.",
      };
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
    <form className="flex flex-col gap-6" onSubmit={submit}>
      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              <h3 className="text-base font-semibold">Role details</h3>
            </CardTitle>
            <CardDescription>
              Give this role a clear name and permanent code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-5">
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
                    updateDirty(code, nextName, selectedPermissions);
                  }}
                  placeholder="Stock manager"
                />
              </Field>
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
                    updateDirty(nextCode, roleName, selectedPermissions);
                  }}
                  placeholder="STOCK_MANAGER"
                />
                <FieldDescription>
                  Uppercase letters, numbers, underscores, or hyphens. This code
                  cannot be changed after creation.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <h3 className="text-base font-semibold">Permissions</h3>
            </CardTitle>
            <CardDescription>
              Grant only the actions this role needs. No grants means no access.
            </CardDescription>
            <CardAction>
              <Badge variant="outline" aria-live="polite">
                {selectedPermissions.length} selected
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <PermissionPicker
              permissions={permissions}
              selected={selectedPermissions}
              labelPrefix="New role"
              disabled={pending}
              onChange={(nextPermissions) => {
                setSelectedPermissions(nextPermissions);
                updateDirty(code, roleName, nextPermissions);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Role was not created</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
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
      </div>
    </form>
  );
}
