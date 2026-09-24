"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import type { Role } from "@/features/roles/types/role.types";
import { StaffBranchAssignments } from "@/features/staff/components/staff-branch-assignments";
import { StaffCreateFields } from "@/features/staff/components/staff-create-fields";
import { createStaffAction } from "@/features/staff/services/staff-actions";
import type {
  StaffBranchOption,
  StaffMutationResult,
} from "@/features/staff/types/staff.types";

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
  const defaultRoleId =
    assignableRoles.find((role) => role.code === "NO_ACCESS")?.id ??
    assignableRoles[0]?.id ??
    "";
  const initialBranchIds =
    initialBranchId && branches.some((branch) => branch.id === initialBranchId)
      ? [initialBranchId]
      : [];
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(defaultRoleId);
  const [branchIds, setBranchIds] = useState<string[]>(initialBranchIds);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  function reportDirty(next: {
    email?: string;
    fullName?: string;
    contactNumber?: string;
    password?: string;
    roleId?: string;
    branchIds?: string[];
  }) {
    const values = {
      email: next.email ?? email,
      fullName: next.fullName ?? fullName,
      contactNumber: next.contactNumber ?? contactNumber,
      password: next.password ?? password,
      roleId: next.roleId ?? roleId,
      branchIds: next.branchIds ?? branchIds,
    };
    onDirtyChange?.(
      Boolean(
        values.email ||
        values.fullName ||
        values.contactNumber ||
        values.password ||
        values.roleId !== defaultRoleId ||
        values.branchIds.length !== initialBranchIds.length ||
        values.branchIds.some((id) => !initialBranchIds.includes(id)),
      ),
    );
  }

  function updateTextField(
    field: "email" | "fullName" | "contactNumber" | "password" | "roleId",
    value: string,
    update: (value: string) => void,
  ) {
    update(value);
    setError("");
    reportDirty({ [field]: value });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setPending(true);
    onPendingChange?.(true);
    let result: StaffMutationResult;
    try {
      result = await createStaffAction({
        email,
        full_name: fullName,
        contact_number: contactNumber,
        password,
        role_id: roleId,
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
    setEmail("");
    setFullName("");
    setContactNumber("");
    setPassword("");
    setRoleId(defaultRoleId);
    onDirtyChange?.(false);
    setStatus("Staff account created.");
    router.refresh();
    onComplete?.();
  }

  return (
    <form
      aria-label="Create a staff account"
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={submit}
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        <StaffCreateFields
          email={email}
          fullName={fullName}
          contactNumber={contactNumber}
          password={password}
          roleId={roleId}
          assignableRoles={assignableRoles}
          onEmailChange={(value) => updateTextField("email", value, setEmail)}
          onFullNameChange={(value) =>
            updateTextField("fullName", value, setFullName)
          }
          onContactNumberChange={(value) =>
            updateTextField("contactNumber", value, setContactNumber)
          }
          onPasswordChange={(value) =>
            updateTextField("password", value, setPassword)
          }
          onRoleChange={(value) => updateTextField("roleId", value, setRoleId)}
        />
        <StaffBranchAssignments
          branches={branches}
          selectedBranchIds={branchIds}
          onChange={(ids) => {
            setBranchIds(ids);
            setError("");
            reportDirty({ branchIds: ids });
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
      <SheetFooter className="mt-0 border-t sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending || !defaultRoleId}>
          {pending ? "Creating staff…" : "Create staff"}
        </Button>
      </SheetFooter>
    </form>
  );
}
