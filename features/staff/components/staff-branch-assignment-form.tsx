"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StaffBranchAssignments } from "@/features/staff/components/staff-branch-assignments";
import { assignStaffBranchesAction } from "@/features/staff/services/staff-actions";
import type {
  StaffBranchOption,
  StaffMember,
  StaffMutationResult,
} from "@/features/staff/types/staff.types";

export function StaffBranchAssignmentForm({
  staff,
  branchId,
  branches,
}: {
  staff: StaffMember;
  branchId?: string;
  branches: StaffBranchOption[];
}) {
  const router = useRouter();
  const [branchIds, setBranchIds] = useState(staff.branch_ids);
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
      result = await assignStaffBranchesAction(staff.id, branchId, {
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
    setStatus("Staff branch assignments updated.");
    router.refresh();
  }

  return (
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        Manage branch assignments
      </summary>
      <form onSubmit={submit} className="mt-4 flex flex-col items-start gap-4">
        <StaffBranchAssignments
          branches={branches}
          selectedBranchIds={branchIds}
          onChange={(ids) => {
            setError("");
            setBranchIds(ids);
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
          <p role="status" className="text-sm text-muted-foreground">
            {status}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving assignments…" : "Save branch assignments"}
        </Button>
      </form>
    </details>
  );
}
