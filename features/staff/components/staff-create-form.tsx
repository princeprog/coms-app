"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/features/roles/types/role.types";
import { StaffCreateAccess } from "@/features/staff/components/staff-create-access";
import { StaffCreateFormFooter } from "@/features/staff/components/staff-create-form-footer";
import {
  initialStaffCreateValues,
  isStaffCreateDirty,
  staffCreateFieldIds,
  staffCreateFieldOrder,
} from "@/features/staff/components/staff-create-form-config";
import {
  StaffCreateFields,
  type StaffCreateValues,
} from "@/features/staff/components/staff-create-fields";
import {
  normalizeStaffContactNumber,
  validateStaffCreateField,
  type StaffCreateField,
  type StaffCreateFieldErrors,
} from "@/features/staff/components/staff-create-validation";
import { createStaffAction } from "@/features/staff/services/staff-actions";
import type {
  StaffBranchOption,
  StaffMutationResult,
} from "@/features/staff/types/staff.types";
import { UNASSIGNED_ROLE_VALUE } from "@/features/staff/constants";

export function StaffCreateForm({
  roles,
  branches,
  initialBranchId,
  onDirtyChange,
  onPendingChange,
  onComplete,
  onCancel,
}: {
  roles: Role[];
  branches: StaffBranchOption[];
  initialBranchId?: string;
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
  const initialBranchIds =
    initialBranchId && branches.some((branch) => branch.id === initialBranchId)
      ? [initialBranchId]
      : [];
  const [values, setValues] = useState<StaffCreateValues>(
    initialStaffCreateValues,
  );
  const [roleId, setRoleId] = useState(UNASSIGNED_ROLE_VALUE);
  const [branchIds, setBranchIds] = useState<string[]>(initialBranchIds);
  const [fieldErrors, setFieldErrors] = useState<StaffCreateFieldErrors>({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  function reportDirty(
    nextValues = values,
    nextRoleId = roleId,
    nextBranchIds = branchIds,
  ) {
    onDirtyChange?.(
      isStaffCreateDirty(
        nextValues,
        nextRoleId,
        nextBranchIds,
        initialBranchIds,
      ),
    );
  }

  function updateField(field: keyof StaffCreateValues, value: string) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    setError("");
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
    reportDirty(nextValues);
  }

  function blurField(field: StaffCreateField) {
    setFieldErrors((current) => ({
      ...current,
      [field]: validateStaffCreateField(field, values[field]),
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setStatus("");

    const nextErrors: StaffCreateFieldErrors = {};
    for (const field of staffCreateFieldOrder) {
      nextErrors[field] = validateStaffCreateField(field, values[field]);
    }
    setFieldErrors(nextErrors);
    const firstInvalid = staffCreateFieldOrder.find(
      (field) => nextErrors[field],
    );
    if (firstInvalid) {
      document.getElementById(staffCreateFieldIds[firstInvalid])?.focus();
      return;
    }

    const contactNumber = normalizeStaffContactNumber(values.contactNumber);
    if (!contactNumber) return;

    setPending(true);
    onPendingChange?.(true);
    let result: StaffMutationResult;
    try {
      result = await createStaffAction({
        email: values.email.trim().toLowerCase(),
        full_name: values.fullName.trim(),
        contact_number: contactNumber,
        password: values.password,
        role_id: roleId === UNASSIGNED_ROLE_VALUE ? null : roleId,
        branch_ids: branchIds,
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
    setValues(initialStaffCreateValues);
    setRoleId(UNASSIGNED_ROLE_VALUE);
    setBranchIds(initialBranchIds);
    setFieldErrors({});
    onDirtyChange?.(false);
    setStatus("Staff account created.");
    router.refresh();
    onComplete?.();
  }

  return (
    <form
      aria-label="Create a staff account"
      className="flex min-h-0 flex-1 flex-col"
      noValidate
      onSubmit={submit}
    >
      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 pt-5 pb-7 sm:px-8">
        <StaffCreateFields
          values={values}
          errors={fieldErrors}
          pending={pending}
          onChange={updateField}
          onBlur={blurField}
        />
        <StaffCreateAccess
          roleId={roleId}
          roles={assignableRoles}
          branchIds={branchIds}
          branches={branches}
          pending={pending}
          onRoleChange={(value) => {
            setRoleId(value);
            setError("");
            reportDirty(values, value);
          }}
          onBranchChange={(ids) => {
            setBranchIds(ids);
            setError("");
            reportDirty(values, roleId, ids);
          }}
          onLimitReached={() =>
            setError("A staff account can be assigned to at most 100 branches.")
          }
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {status && (
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-muted-foreground"
          >
            {status}
          </p>
        )}
      </div>
      <StaffCreateFormFooter pending={pending} onCancel={onCancel} />
    </form>
  );
}
