"use client";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/features/roles/types/role.types";
import { StaffCreateBranchPicker } from "@/features/staff/components/staff-create-branch-picker";
import { UNASSIGNED_ROLE_VALUE } from "@/features/staff/constants";
import type { StaffBranchOption } from "@/features/staff/types/staff.types";

export function StaffCreateAccess({
  roleId,
  roles,
  branchIds,
  branches,
  pending,
  onRoleChange,
  onBranchChange,
  onLimitReached,
}: {
  roleId: string;
  roles: Role[];
  branchIds: string[];
  branches: StaffBranchOption[];
  pending: boolean;
  onRoleChange: (roleId: string) => void;
  onBranchChange: (ids: string[]) => void;
  onLimitReached: () => void;
}) {
  return (
    <section
      aria-labelledby="staff-create-access"
      className="space-y-4 border-t pt-5"
    >
      <h3 id="staff-create-access" className="text-sm font-semibold">
        Access
      </h3>
      <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
        <Field className="gap-2">
          <FieldLabel htmlFor="staff-create-role">Role</FieldLabel>
          <Select
            value={roleId}
            onValueChange={(value) =>
              onRoleChange(value ?? UNASSIGNED_ROLE_VALUE)
            }
          >
            <SelectTrigger
              id="staff-create-role"
              aria-describedby={
                roleId === UNASSIGNED_ROLE_VALUE
                  ? "staff-create-role-hint"
                  : undefined
              }
              className="w-full data-[size=default]:h-11"
              disabled={pending}
            >
              <SelectValue>
                {(value: unknown) =>
                  value === UNASSIGNED_ROLE_VALUE
                    ? "Unassigned"
                    : (roles.find((role) => role.id === value)?.role_name ??
                      "Select a role")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              data-coms-ui="operational"
              alignItemWithTrigger={false}
            >
              <SelectItem value={UNASSIGNED_ROLE_VALUE}>Unassigned</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.role_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {roleId === UNASSIGNED_ROLE_VALUE && (
            <FieldDescription id="staff-create-role-hint">
              No access until a role is assigned.
            </FieldDescription>
          )}
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor="staff-create-branches">Branches</FieldLabel>
          <StaffCreateBranchPicker
            branches={branches}
            selectedBranchIds={branchIds}
            pending={pending}
            onChange={onBranchChange}
            onLimitReached={onLimitReached}
          />
          {branches.length === 0 && (
            <FieldDescription>No active branches available.</FieldDescription>
          )}
        </Field>
      </div>
    </section>
  );
}
