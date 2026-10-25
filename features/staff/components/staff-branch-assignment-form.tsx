"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { StaffEditFormFooter } from "./staff-edit-form-footer";
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
  onComplete,
  onCancel,
}: {
  staff: StaffMember;
  branchId?: string;
  branches: StaffBranchOption[];
  onDirtyChange?: (dirty: boolean) => void;
  onPendingChange?: (pending: boolean) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [branchIds, setBranchIds] = useState(staff.branch_ids);
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
    toast.add({ type: "success", title: "Branch access updated." });
    router.refresh();
    onComplete?.();
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-col">
      <div className="min-h-0 space-y-5 overflow-y-auto px-5 pb-6 sm:px-8 [&_input]:h-10 [&_[data-slot=select-trigger]]:h-10">
        <StaffBranchAssignments
          disabled={pending}
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
      </div>
      <StaffEditFormFooter
        pending={pending}
        onCancel={onCancel}
        label="Save branch assignments"
        pendingLabel="Saving assignments…"
      />
    </form>
  );
}
