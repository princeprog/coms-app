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
    <section aria-labelledby="staff-create-access" className="space-y-4">
      <h3
        id="staff-create-access"
        className="border-b pb-2 text-base font-semibold"
      >
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
              className="h-11 w-full"
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
            <SelectContent data-coms-ui="operational">
              <SelectItem value={UNASSIGNED_ROLE_VALUE}>Unassigned</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.role_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>
            Unassigned staff can sign in but cannot access COMS operations.
          </FieldDescription>
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
          <FieldDescription>
            {branches.length === 0
              ? "No active branches are available to assign."
              : "Choose the branches this staff member can access."}
          </FieldDescription>
        </Field>
      </div>
    </section>
  );
}
