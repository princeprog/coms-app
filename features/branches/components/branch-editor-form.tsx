"use client";

import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const [hasDineIn, setHasDineIn] = useState(branch.has_dine_in);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const dirty =
    branchName !== branch.branch_name ||
    address !== (branch.address ?? "") ||
    dateOpened !== dateInputValue(branch.date_opened) ||
    hasDineIn !== branch.has_dine_in;

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
    setError("");
    setPending(true);
    let result: BranchMutationResult;
    try {
      result = await updateBranchAction(branch.id, {
        branch_name: branchName,
        address: address.trim() || null,
        date_opened: dateOpened || null,
        has_dine_in: hasDineIn,
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) return;
        requestClose();
      }}
    >
      <DialogContent
        data-coms-ui="operational"
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Edit branch</DialogTitle>
          <DialogDescription>
            Update {branch.branch_name}. The branch code is permanent.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <BranchLocationFields
            idPrefix={`branch-${branch.id}`}
            branchName={branchName}
            address={address}
            dateOpened={dateOpened}
            hasDineIn={hasDineIn}
            disabled={pending}
            onBranchNameChange={setBranchName}
            onAddressChange={setAddress}
            onDateOpenedChange={setDateOpened}
            onHasDineInChange={setHasDineIn}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving branch…" : "Save branch details"}
            </Button>
          </DialogFooter>
        </form>
        <BranchDiscardConfirmation
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          onDiscard={() => {
            setDiscardOpen(false);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
