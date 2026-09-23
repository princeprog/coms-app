"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionPicker } from "@/features/roles/components/permission-picker";
import { createRoleAction } from "@/features/roles/services/role-actions";
import type {
  Permission,
  RoleMutationResult,
} from "@/features/roles/types/role.types";

export function RoleCreateForm({
  permissions,
  onComplete,
}: {
  permissions: Permission[];
  onComplete: () => void;
}) {
  const [code, setCode] = useState("");
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setPending(true);
    let result: RoleMutationResult;
    try {
      result = await createRoleAction({
        code,
        role_name: roleName,
        permission_keys: selectedPermissions,
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
    setCode("");
    setRoleName("");
    setSelectedPermissions([]);
    setStatus("Role created.");
    onComplete();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a role</CardTitle>
        <p className="text-sm text-muted-foreground">
          Create a custom role and grant only the actions staff need.
        </p>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="role-code" className="text-sm font-medium">
                Role code
              </label>
              <Input
                id="role-code"
                required
                minLength={2}
                maxLength={50}
                pattern="[A-Z0-9][A-Z0-9_-]{1,49}"
                autoCapitalize="characters"
                value={code}
                onChange={(event) =>
                  setCode(event.currentTarget.value.toUpperCase())
                }
                placeholder="STOCK_MANAGER"
              />
              <p className="text-xs text-muted-foreground">
                Use uppercase letters, numbers, underscores, or hyphens.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="role-name" className="text-sm font-medium">
                Role name
              </label>
              <Input
                id="role-name"
                required
                minLength={2}
                maxLength={160}
                value={roleName}
                onChange={(event) => setRoleName(event.currentTarget.value)}
                placeholder="Stock manager"
              />
            </div>
          </div>
          <PermissionPicker
            permissions={permissions}
            selected={selectedPermissions}
            labelPrefix="New role"
            onChange={setSelectedPermissions}
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
            <Button type="submit" disabled={pending}>
              {pending ? "Creating role…" : "Create role"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
