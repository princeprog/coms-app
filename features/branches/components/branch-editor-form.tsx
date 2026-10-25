"use client";

import { useState, type FormEvent } from "react";
import { BranchDialogFrame } from "@/features/branches/components/branch-dialog-frame";
import { BranchDiscardConfirmation } from "@/features/branches/components/branch-discard-confirmation";
import { BranchLocationFields } from "@/features/branches/components/branch-location-fields";
import { updateBranchAction } from "@/features/branches/services/branch-actions";
import type {
  Branch,
  BranchMutationResult,
} from "@/features/branches/types/branch.types";

function dateInputValue(value: string | null) {
  return value?.slice(0, 10) ?? "";
}

export function BranchEditorForm({
  branch,
  open,
  onOpenChange,
  onComplete,
}: {
  branch: Branch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}) {
  const [branchName, setBranchName] = useState(branch.branch_name);
  const [address, setAddress] = useState(branch.address ?? "");
  const [dateOpened, setDateOpened] = useState(
    dateInputValue(branch.date_opened),
  );
  const [hasTakeout, setHasTakeout] = useState(branch.has_takeaway !== false);
  const [hasDineIn, setHasDineIn] = useState(branch.has_dine_in);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const dirty =
    branchName !== branch.branch_name ||
    address !== (branch.address ?? "") ||
    dateOpened !== dateInputValue(branch.date_opened) ||
    hasDineIn !== branch.has_dine_in ||
    hasTakeout !== (branch.has_takeaway !== false);

  function requestClose() {
    if (pending) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (branch.status === "active" && !hasDineIn && !hasTakeout) {
      setError("Choose dine-in, takeout or both.");
      return;
    }
    setError("");
    setPending(true);
    let result: BranchMutationResult;
    try {
      result = await updateBranchAction(branch.id, {
        branch_name: branchName,
        address: address.trim() || null,
        date_opened: dateOpened || null,
        has_dine_in: hasDineIn,
        has_takeaway: hasTakeout,
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
    onOpenChange(false);
    onComplete();
  }

  return (
    <BranchDialogFrame
      open={open}
      title="Edit branch"
      description={`Branch code ${branch.code}.`}
      pending={pending}
      error={error}
      errorTitle="Could not update branch"
      submitLabel="Save branch"
      pendingLabel="Saving branch…"
      onRequestClose={requestClose}
      onSubmit={submit}
      after={
        <BranchDiscardConfirmation
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          onDiscard={() => {
            setDiscardOpen(false);
            onOpenChange(false);
          }}
        />
      }
    >
      <BranchLocationFields
        idPrefix={`branch-${branch.id}`}
        branchName={branchName}
        address={address}
        dateOpened={dateOpened}
        hasDineIn={hasDineIn}
        hasTakeout={hasTakeout}
        disabled={pending}
        onBranchNameChange={setBranchName}
        onAddressChange={setAddress}
        onDateOpenedChange={setDateOpened}
        onHasDineInChange={setHasDineIn}
        onHasTakeoutChange={setHasTakeout}
      />
    </BranchDialogFrame>
  );
}
