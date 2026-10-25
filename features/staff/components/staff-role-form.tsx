"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { StaffEditFormFooter } from "./staff-edit-form-footer";
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
import { UNASSIGNED_ROLE_VALUE } from "@/features/staff/constants";

export function StaffRoleForm({
  staff,
  branchId,
  roles,
  rolesFailed,
  onDirtyChange,
  onPendingChange,
  onComplete,
  onCancel,
}: {
  staff: StaffMember;
  branchId?: string;
  roles: Role[];
  rolesFailed: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onPendingChange?: (pending: boolean) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const assignableRoles = roles.filter(
    (role) =>
      role.is_active && !(role.is_system && role.code === "SUPER_ADMIN"),
  );
  const initialRoleId =
    staff.role_id === null
      ? UNASSIGNED_ROLE_VALUE
      : assignableRoles.some((role) => role.id === staff.role_id)
        ? staff.role_id
        : "";
  const [roleId, setRoleId] = useState(initialRoleId);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setPending(true);
    onPendingChange?.(true);
    let result: StaffMutationResult;
    try {
      result = await assignStaffRoleAction(staff.id, branchId, {
        role_id: roleId === UNASSIGNED_ROLE_VALUE ? null : roleId,
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
    toast.add({ type: "success", title: "Staff role updated." });
    router.refresh();
    onComplete?.();
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-col">
      <div className="min-h-0 space-y-5 overflow-y-auto px-5 pb-6 sm:px-8 [&_input]:h-10 [&_[data-slot=select-trigger]]:h-10">
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
                Staff role
                <span className="sr-only"> for {staff.full_name}</span>
              </FieldLabel>
              <Select
                disabled={pending}
                value={roleId}
                onValueChange={(value) => {
                  setRoleId(value ?? "");
                  onDirtyChange?.((value ?? "") !== initialRoleId);
                }}
              >
                <SelectTrigger id={`staff-${staff.id}-role`} className="w-full">
                  <SelectValue placeholder="Select a role">
                    {(value: unknown) =>
                      value === UNASSIGNED_ROLE_VALUE
                        ? "Unassigned"
                        : (assignableRoles.find((role) => role.id === value)
                            ?.role_name ?? "Select a role")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  data-coms-ui="operational"
                  alignItemWithTrigger={false}
                >
                  <SelectItem value={UNASSIGNED_ROLE_VALUE}>
                    Unassigned
                  </SelectItem>
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
          </>
        )}
      </div>
      <StaffEditFormFooter
        pending={pending}
        onCancel={onCancel}
        disabled={
          rolesFailed ||
          assignableRoles.length === 0 ||
          !roleId ||
          roleId === initialRoleId
        }
        label={
          roleId === UNASSIGNED_ROLE_VALUE && staff.role_id !== null
            ? "Remove role"
            : "Assign role"
        }
        pendingLabel="Saving role…"
      />
    </form>
  );
}
