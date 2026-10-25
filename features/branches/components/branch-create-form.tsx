"use client";

import { useState, type FormEvent } from "react";
import { BranchDialogFrame } from "@/features/branches/components/branch-dialog-frame";
import { BranchDiscardConfirmation } from "@/features/branches/components/branch-discard-confirmation";
import { BranchLocationFields } from "@/features/branches/components/branch-location-fields";
import { createBranchAction } from "@/features/branches/services/branch-actions";
import type { BranchCreateResult } from "@/features/branches/types/branch.types";

export function BranchCreateForm({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (code: string) => void;
}) {
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [dateOpened, setDateOpened] = useState("");
  const [hasTakeout, setHasTakeout] = useState(true);
  const [hasDineIn, setHasDineIn] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const dirty = Boolean(
    branchName || address || dateOpened || hasDineIn || !hasTakeout,
  );

  function reset() {
    setBranchName("");
    setAddress("");
    setDateOpened("");
    setHasDineIn(false);
    setHasTakeout(true);
    setError("");
  }

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
    if (!hasDineIn && !hasTakeout) {
      setError("Choose dine-in, takeout or both.");
      return;
    }
    setError("");
    setPending(true);
    let result: BranchCreateResult;
    try {
      result = await createBranchAction({
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
    reset();
    onOpenChange(false);
    onComplete(result.code);
  }

  return (
    <BranchDialogFrame
      open={open}
      title="Create branch"
      description="COMS assigns the branch code automatically."
      pending={pending}
      error={error}
      errorTitle="Could not create branch"
      submitLabel="Create branch"
      pendingLabel="Creating branch…"
      onRequestClose={requestClose}
      onSubmit={submit}
      after={
        <BranchDiscardConfirmation
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          onDiscard={() => {
            setDiscardOpen(false);
            reset();
            onOpenChange(false);
          }}
        />
      }
    >
      <BranchLocationFields
        idPrefix="branch-create"
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
