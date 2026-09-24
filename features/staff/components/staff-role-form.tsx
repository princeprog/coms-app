"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/features/roles/types/role.types";
import { assignStaffRoleAction } from "@/features/staff/services/staff-actions";
import type {
  StaffMember,
  StaffMutationResult,
} from "@/features/staff/types/staff.types";

export function StaffRoleForm({
  staff,
  branchId,
  roles,
  rolesFailed,
  onDirtyChange,
  onPendingChange,
}: {
  staff: StaffMember;
  branchId?: string;
  roles: Role[];
  rolesFailed: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const router = useRouter();
  const assignableRoles = roles.filter(
    (role) =>
      role.is_active && !(role.is_system && role.code === "SUPER_ADMIN"),
  );
  const initialRoleId = assignableRoles.some(
    (role) => role.id === staff.role_id,
  )
    ? staff.role_id
    : "";
  const [roleId, setRoleId] = useState(initialRoleId);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setPending(true);
    onPendingChange?.(true);
    let result: StaffMutationResult;
    try {
      result = await assignStaffRoleAction(staff.id, branchId, {
        role_id: roleId,
      });
    } catch {
      setPending(false);
      onPendingChange?.(false);
      setError("COMS could not complete this change. Try again.");
      return;
    }
    setPending(false);
    onPendingChange?.(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDirtyChange?.(false);
    setStatus("Staff role updated.");
    router.refresh();
  }

  return (
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        Assign role
      </summary>
      <form onSubmit={submit} className="mt-4 flex flex-col items-start gap-4">
        {rolesFailed ? (
          <p role="alert" className="text-sm text-destructive">
            COMS could not load account roles. Try refreshing this page.
          </p>
        ) : assignableRoles.length === 0 ? (
          <p role="status" className="text-sm text-muted-foreground">
            Activate an assignable role before changing staff roles.
          </p>
        ) : (
          <>
            <Field className="w-full max-w-md">
              <FieldLabel htmlFor={`staff-${staff.id}-role`}>
                Staff role for {staff.full_name}
              </FieldLabel>
              <Select
                value={roleId}
                onValueChange={(value) => {
                  setRoleId(value ?? "");
                  onDirtyChange?.((value ?? "") !== initialRoleId);
                }}
              >
                <SelectTrigger id={`staff-${staff.id}-role`} className="w-full">
                  <SelectValue placeholder="Select a role">
                    {(value: unknown) =>
                      assignableRoles.find((role) => role.id === value)
                        ?.role_name ?? "Select a role"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent data-coms-ui="operational">
                  {assignableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
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
            <Button type="submit" disabled={pending || !roleId}>
              {pending ? "Assigning role…" : "Assign role"}
            </Button>
          </>
        )}
      </form>
    </details>
  );
}
