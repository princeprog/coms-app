"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
}: {
  staff: StaffMember;
  branchId?: string;
  roles: Role[];
  rolesFailed: boolean;
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
    let result: StaffMutationResult;
    try {
      result = await assignStaffRoleAction(staff.id, branchId, {
        role_id: roleId,
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
    setStatus("Staff role updated.");
    router.refresh();
  }

  return (
    <details className="rounded-xl border p-4">
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
            <label className="flex w-full max-w-md flex-col gap-2 text-sm font-medium">
              Staff role for {staff.full_name}
              <NativeSelect
                required
                value={roleId}
                onChange={(event) => setRoleId(event.currentTarget.value)}
              >
                <NativeSelectOption value="">Select a role</NativeSelectOption>
                {assignableRoles.map((role) => (
                  <NativeSelectOption key={role.id} value={role.id}>
                    {role.role_name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
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
