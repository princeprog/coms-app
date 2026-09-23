"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Role } from "@/features/roles/types/role.types";
import { createStaffAction } from "@/features/staff/services/staff-actions";
import { StaffBranchAssignments } from "@/features/staff/components/staff-branch-assignments";
import type { StaffBranchOption } from "@/features/staff/components/staff-card";
import { StaffCreateFields } from "@/features/staff/components/staff-create-fields";
import type { StaffMutationResult } from "@/features/staff/types/staff.types";

export function StaffCreateForm({
  roles,
  branches,
  initialBranchId,
}: {
  roles: Role[];
  branches: StaffBranchOption[];
  initialBranchId?: string;
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
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(defaultRoleId);
  const [branchIds, setBranchIds] = useState<string[]>(() =>
    initialBranchId && branches.some((branch) => branch.id === initialBranchId)
      ? [initialBranchId]
      : [],
  );
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
      setError("COMS could not complete this change. Try again.");
      return;
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEmail("");
    setFullName("");
    setContactNumber("");
    setPassword("");
    setRoleId(defaultRoleId);
    setStatus("Staff account created.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a staff account</CardTitle>
        <p className="text-sm text-muted-foreground">
          Give the account an initial role and branch access. Use a grant-free
          role until the person is ready to work.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <StaffCreateFields
            email={email}
            fullName={fullName}
            contactNumber={contactNumber}
            password={password}
            roleId={roleId}
            assignableRoles={assignableRoles}
            onEmailChange={setEmail}
            onFullNameChange={setFullName}
            onContactNumberChange={setContactNumber}
            onPasswordChange={setPassword}
            onRoleChange={setRoleId}
          />
          <StaffBranchAssignments
            branches={branches}
            selectedBranchIds={branchIds}
            onChange={(branchIds) => {
              setError("");
              setBranchIds(branchIds);
            }}
            onLimitReached={() =>
              setError(
                "A staff account can be assigned to at most 100 branches.",
              )
            }
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
            <Button type="submit" disabled={pending || !defaultRoleId}>
              {pending ? "Creating staff…" : "Create staff"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
