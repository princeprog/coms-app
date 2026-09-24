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
  onDirtyChange,
  onPendingChange,
}: {
  staff: StaffMember;
  branchId?: string;
  branches: StaffBranchOption[];
  onDirtyChange?: (dirty: boolean) => void;
  onPendingChange?: (pending: boolean) => void;
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
    onPendingChange?.(true);
    let result: StaffMutationResult;
    try {
      result = await assignStaffBranchesAction(staff.id, branchId, {
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
    onDirtyChange?.(false);
    setStatus("Staff branch assignments updated.");
    router.refresh();
  }

  return (
    <details className="rounded-lg border p-4">
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
            onDirtyChange?.(
              ids.length !== staff.branch_ids.length ||
                ids.some((id) => !staff.branch_ids.includes(id)),
            );
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
