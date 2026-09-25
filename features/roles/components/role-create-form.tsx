"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RoleCreatePermissionPicker } from "@/features/roles/components/role-create-permission-picker";
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
    <form className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={submit}>
      <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 lg:grid-cols-3 lg:grid-rows-1 lg:gap-5">
        <Card className="gap-0 py-0 lg:col-span-1">
          <CardHeader className="border-b px-3 py-2.5 sm:px-5 sm:py-4">
            <CardTitle>
              <h3 className="text-lg font-semibold">Role details</h3>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-5">
            <FieldGroup className="gap-3 min-[360px]:grid min-[360px]:grid-cols-2 lg:flex lg:gap-5">
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
                  placeholder="Branch Manager"
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
                  aria-describedby="new-role-code-help"
                  value={code}
                  disabled={pending}
                  onChange={(event) => {
                    const nextCode = event.currentTarget.value.toUpperCase();
                    setCode(nextCode);
                    updateDirty(nextCode, roleName, selectedPermissions);
                  }}
                  placeholder="BRANCH_MANAGER"
                />
              </Field>
            </FieldGroup>
            <FieldDescription
              id="new-role-code-help"
              className="mt-2 text-xs sm:mt-3"
            >
              Use uppercase letters, numbers, underscores, or hyphens. The code
              cannot be changed after creation.
            </FieldDescription>
            <Separator className="my-3 sm:my-5" />
            <div className="grid gap-1 rounded-md bg-muted/40 p-2 sm:gap-2 sm:p-3">
              <Badge
                variant="secondary"
                aria-live="polite"
                className="w-fit text-primary"
              >
                {selectedPermissions.length} permissions selected
              </Badge>
              <p className="text-xs text-muted-foreground">
                Members receive only the permissions selected here.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0 min-w-0 gap-0 py-0 lg:col-span-2">
          <CardHeader className="shrink-0 px-3 pt-3 pb-2 sm:px-5 sm:pt-4 sm:pb-3">
            <CardTitle>
              <h3 className="text-lg font-semibold">Permissions</h3>
            </CardTitle>
            <CardDescription>
              Choose what members of this role can view and manage.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col px-3 pb-3 sm:px-5 sm:pb-4">
            <RoleCreatePermissionPicker
              permissions={permissions}
              selected={selectedPermissions}
              disabled={pending}
              onChange={(nextPermissions) => {
                setSelectedPermissions(nextPermissions);
                updateDirty(code, roleName, nextPermissions);
              }}
            />
          </CardContent>
        </Card>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t pt-4">
        {error ? (
          <Alert variant="destructive" className="max-w-xl py-2">
            <AlertTitle>Role was not created</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-xs text-muted-foreground">
            You can update permissions after creating the role.
          </p>
        )}
        <div className="ml-auto flex items-center gap-2">
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
      </footer>
    </form>
  );
}
